import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:workmanager/workmanager.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'app.dart';
import 'core/constants/app_constants.dart';
import 'core/services/background_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/ml_service.dart';
import 'core/utils/logger.dart';

/// Background task dispatcher for Workmanager
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      AppLogger.info('Background task started: $task');
      
      switch (task) {
        case AppConstants.threatMonitoringTask:
          await BackgroundService.performThreatMonitoring();
          break;
        case AppConstants.modelUpdateTask:
          await MLService.updateModelsInBackground();
          break;
        case AppConstants.quantumCheckTask:
          await BackgroundService.performQuantumCheck();
          break;
        default:
          AppLogger.warning('Unknown background task: $task');
      }
      
      AppLogger.info('Background task completed: $task');
      return Future.value(true);
    } catch (e, stackTrace) {
      AppLogger.error('Background task failed: $task', e, stackTrace);
      return Future.value(false);
    }
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize core services
  await _initializeApp();
  
  // Run the app
  runApp(
    ProviderScope(
      child: PQShieldApp(),
    ),
  );
}

Future<void> _initializeApp() async {
  try {
    AppLogger.info('Initializing PQShield Mobile App...');
    
    // Set preferred orientations
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    
    // Initialize Firebase
    await Firebase.initializeApp();
    AppLogger.info('Firebase initialized');
    
    // Initialize Hive for local storage
    await Hive.initFlutter();
    await Hive.openBox(AppConstants.settingsBox);
    await Hive.openBox(AppConstants.threatHistoryBox);
    await Hive.openBox(AppConstants.modelCacheBox);
    AppLogger.info('Hive storage initialized');
    
    // Initialize notifications
    await NotificationService.initialize();
    AppLogger.info('Notification service initialized');
    
    // Initialize background services
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );
    
    // Register periodic background tasks
    await _registerBackgroundTasks();
    AppLogger.info('Background services initialized');
    
    // Initialize ML models
    await MLService.initialize();
    AppLogger.info('ML models initialized');
    
    AppLogger.info('PQShield Mobile App initialization completed');
    
  } catch (e, stackTrace) {
    AppLogger.error('App initialization failed', e, stackTrace);
    // Continue with app launch even if some services fail
  }
}

Future<void> _registerBackgroundTasks() async {
  try {
    // Threat monitoring every 15 minutes
    await Workmanager().registerPeriodicTask(
      AppConstants.threatMonitoringTask,
      AppConstants.threatMonitoringTask,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
        requiresCharging: false,
      ),
      inputData: {
        'priority': 'high',
        'timeout': 30000, // 30 seconds
      },
    );
    
    // Model updates daily
    await Workmanager().registerPeriodicTask(
      AppConstants.modelUpdateTask,
      AppConstants.modelUpdateTask,
      frequency: const Duration(hours: 24),
      constraints: Constraints(
        networkType: NetworkType.unmetered, // WiFi only
        requiresBatteryNotLow: true,
        requiresCharging: true,
      ),
    );
    
    // Quantum resistance check weekly
    await Workmanager().registerPeriodicTask(
      AppConstants.quantumCheckTask,
      AppConstants.quantumCheckTask,
      frequency: const Duration(days: 7),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
    );
    
    AppLogger.info('Background tasks registered successfully');
  } catch (e, stackTrace) {
    AppLogger.error('Failed to register background tasks', e, stackTrace);
  }
}
