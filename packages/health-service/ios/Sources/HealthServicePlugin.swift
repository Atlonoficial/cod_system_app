import Foundation
import Capacitor
import HealthKit

@objc(HealthServicePlugin)
public class HealthServicePlugin: CAPPlugin {
    
    private let healthStore = HKHealthStore()
    
    // MARK: - Check availability
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        call.resolve(["available": available])
    }
    
    // MARK: - Request permissions
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false])
            return
        }
        
        // Types to read
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if let error = error {
                print("[HealthService] Authorization error: \(error.localizedDescription)")
            }
            call.resolve(["granted": success])
        }
    }
    
    // MARK: - Get sleep data
    
    @objc func getSleepData(_ call: CAPPluginCall) {
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate"),
              let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date parameters")
            return
        }
        
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, samples, error in
            if let error = error {
                call.reject("Failed to get sleep data: \(error.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKCategorySample], !samples.isEmpty else {
                call.reject("No sleep data available")
                return
            }
            
            var totalSleepSeconds: Double = 0
            var deepSleepSeconds: Double = 0
            var remSleepSeconds: Double = 0
            
            for sample in samples {
                let duration = sample.endDate.timeIntervalSince(sample.startDate)
                
                switch sample.value {
                case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                    deepSleepSeconds += duration
                    totalSleepSeconds += duration
                case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                    remSleepSeconds += duration
                    totalSleepSeconds += duration
                case HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                     HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                    totalSleepSeconds += duration
                default:
                    break
                }
            }
            
            let sleepHours = totalSleepSeconds / 3600.0
            
            // Calculate quality (1-10 scale based on duration and deep/REM ratio)
            var quality = min(10, max(1, sleepHours / 8.0 * 10))
            let deepRemRatio = (deepSleepSeconds + remSleepSeconds) / max(1, totalSleepSeconds)
            quality = quality * (0.6 + deepRemRatio * 0.4)
            
            call.resolve([
                "sleepDuration": sleepHours,
                "sleepQuality": Int(quality),
                "deepSleepMinutes": Int(deepSleepSeconds / 60),
                "remSleepMinutes": Int(remSleepSeconds / 60),
                "lastUpdated": ISO8601DateFormatter().string(from: Date())
            ])
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Get heart rate / HRV data
    
    @objc func getHeartRateData(_ call: CAPPluginCall) {
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate"),
              let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date parameters")
            return
        }
        
        let dispatchGroup = DispatchGroup()
        var hrvValue: Double = 0
        var restingHR: Double = 0
        
        // Get HRV
        dispatchGroup.enter()
        let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        let hrvQuery = HKStatisticsQuery(quantityType: hrvType, quantitySamplePredicate: predicate, options: .discreteAverage) { _, result, _ in
            if let avgHRV = result?.averageQuantity() {
                hrvValue = avgHRV.doubleValue(for: HKUnit.secondUnit(with: .milli))
            }
            dispatchGroup.leave()
        }
        healthStore.execute(hrvQuery)
        
        // Get resting heart rate
        dispatchGroup.enter()
        let restingHRType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!
        
        let restingHRQuery = HKStatisticsQuery(quantityType: restingHRType, quantitySamplePredicate: predicate, options: .discreteAverage) { _, result, _ in
            if let avgResting = result?.averageQuantity() {
                restingHR = avgResting.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            }
            dispatchGroup.leave()
        }
        healthStore.execute(restingHRQuery)
        
        dispatchGroup.notify(queue: .main) {
            call.resolve([
                "avgHRV": hrvValue,
                "restingHeartRate": Int(restingHR)
            ])
        }
    }
}
