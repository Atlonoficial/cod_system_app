require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CoodHealthService'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = 'https://codsystem.com'
  s.author = package['author']
  s.source = { :git => 'https://github.com/Atlonoficial/cod_system_app.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '13.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
