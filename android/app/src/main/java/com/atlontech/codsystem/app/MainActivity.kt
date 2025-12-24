package com.atlontech.codsystem.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.atlontech.codsystem.app.plugins.HealthServicePlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom plugins
        registerPlugin(HealthServicePlugin::class.java)
        
        super.onCreate(savedInstanceState)
    }
}
