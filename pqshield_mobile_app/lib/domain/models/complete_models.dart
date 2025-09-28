import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'complete_models.freezed.dart';
part 'complete_models.g.dart';

// ============ User & Authentication ============

@freezed
@HiveType(typeId: 1)
class User with _$User {
  const factory User({
    @HiveField(0) required String id,
    @HiveField(1) required String email,
    @HiveField(2) String? displayName,
    @HiveField(3) String? photoUrl,
    @HiveField(4) required UserRole role,
    @HiveField(5) required SecurityLevel securityLevel,
    @HiveField(6) required DateTime createdAt,
    @HiveField(7) DateTime? lastLoginAt,
    @HiveField(8) required UserPreferences preferences,
    @HiveField(9) required SubscriptionPlan subscription,
    @HiveField(10) Map<String, dynamic>? metadata,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@HiveType(typeId: 2)
enum UserRole {
  @HiveField(0) user,
  @HiveField(1) admin,
  @HiveField(2) analyst,
  @HiveField(3) enterprise,
}

@HiveType(typeId: 3)
enum SecurityLevel {
  @HiveField(0) basic,
  @HiveField(1) standard,
  @HiveField(2) advanced,
  @HiveField(3) quantum,
}

@freezed
class UserPreferences with _$UserPreferences {
  const factory UserPreferences({
    required ThemeMode theme,
    required String language,
    required bool biometricEnabled,
    required bool notificationsEnabled,
    required NotificationSettings notifications,
    required PrivacySettings privacy,
    required SecuritySettings security,
  }) = _UserPreferences;

  factory UserPreferences.fromJson(Map<String, dynamic> json) => _$UserPreferencesFromJson(json);
}

@freezed
class NotificationSettings with _$NotificationSettings {
  const factory NotificationSettings({
    required bool threatAlerts,
    required bool scanComplete,
    required bool systemUpdates,
    required bool marketingEmails,
    required bool weeklyReports,
    required NotificationPriority minimumPriority,
    required List<String> quietHours,
  }) = _NotificationSettings;

  factory NotificationSettings.fromJson(Map<String, dynamic> json) => _$NotificationSettingsFromJson(json);
}

@HiveType(typeId: 4)
enum NotificationPriority {
  @HiveField(0) low,
  @HiveField(1) medium,
  @HiveField(2) high,
  @HiveField(3) critical,
}

// ============ Threat Models ============

@freezed
@HiveType(typeId: 5)
class Threat with _$Threat {
  const factory Threat({
    @HiveField(0) required String id,
    @HiveField(1) required ThreatType type,
    @HiveField(2) required ThreatSeverity severity,
    @HiveField(3) required String title,
    @HiveField(4) required String description,
    @HiveField(5) required ThreatSource source,
    @HiveField(6) required DateTime detectedAt,
    @HiveField(7) DateTime? mitigatedAt,
    @HiveField(8) required ThreatStatus status,
    @HiveField(9) required double confidenceScore,
    @HiveField(10) ThreatVector? vector,
    @HiveField(11) List<String>? affectedResources,
    @HiveField(12) MitigationAction? suggestedAction,
    @HiveField(13) Map<String, dynamic>? technicalDetails,
    @HiveField(14) List<String>? indicators,
    @HiveField(15) String? malwareFamily,
    @HiveField(16) QuantumThreatInfo? quantumInfo,
  }) = _Threat;

  factory Threat.fromJson(Map<String, dynamic> json) => _$ThreatFromJson(json);
}

@HiveType(typeId: 6)
enum ThreatType {
  @HiveField(0) malware,
  @HiveField(1) phishing,
  @HiveField(2) networkIntrusion,
  @HiveField(3) dataLeak,
  @HiveField(4) zeroDay,
  @HiveField(5) ransomware,
  @HiveField(6) spyware,
  @HiveField(7) trojan,
  @HiveField(8) botnet,
  @HiveField(9) cryptojacking,
  @HiveField(10) quantumAttack,
  @HiveField(11) aiPoisoning,
}

@HiveType(typeId: 7)
enum ThreatSeverity {
  @HiveField(0) low,      // 0.0 - 0.3
  @HiveField(1) medium,   // 0.3 - 0.6
  @HiveField(2) high,     // 0.6 - 0.8
  @HiveField(3) critical, // 0.8 - 1.0
}

@HiveType(typeId: 8)
enum ThreatStatus {
  @HiveField(0) detected,
  @HiveField(1) analyzing,
  @HiveField(2) confirmed,
  @HiveField(3) mitigated,
  @HiveField(4) resolved,
  @HiveField(5) falsePositive,
}

@HiveType(typeId: 9)
enum ThreatSource {
  @HiveField(0) snnDetection,
  @HiveField(1) annClassification,
  @HiveField(2) quantumAnalysis,
  @HiveField(3) networkMonitoring,
  @HiveField(4) fileScanning,
  @HiveField(5) behaviorAnalysis,
  @HiveField(6) threatIntelligence,
  @HiveField(7) userReport,
}

@freezed
class ThreatVector with _$ThreatVector {
  const factory ThreatVector({
    required String entryPoint,
    required String propagationMethod,
    List<String>? exploitedVulnerabilities,
    Map<String, dynamic>? attackPattern,
  }) = _ThreatVector;

  factory ThreatVector.fromJson(Map<String, dynamic> json) => _$ThreatVectorFromJson(json);
}

@freezed
class MitigationAction with _$MitigationAction {
  const factory MitigationAction({
    required String action,
    required String description,
    required ActionPriority priority,
    required bool automated,
    List<String>? steps,
    Map<String, dynamic>? parameters,
  }) = _MitigationAction;

  factory MitigationAction.fromJson(Map<String, dynamic> json) => _$MitigationActionFromJson(json);
}

@HiveType(typeId: 10)
enum ActionPriority {
  @HiveField(0) low,
  @HiveField(1) medium,
  @HiveField(2) high,
  @HiveField(3) immediate,
}

@freezed
class QuantumThreatInfo with _$QuantumThreatInfo {
  const factory QuantumThreatInfo({
    required double quantumResistanceScore,
    required bool vulnerableToShor,
    required bool vulnerableToGrover,
    required int estimatedQubitsNeeded,
    required Duration estimatedTimeToBreak,
    List<String>? vulnerableAlgorithms,
    List<String>? recommendedMigrations,
  }) = _QuantumThreatInfo;

  factory QuantumThreatInfo.fromJson(Map<String, dynamic> json) => _$QuantumThreatInfoFromJson(json);
}

// ============ Neural Network Models ============

@freezed
class NeuralNetworkState with _$NeuralNetworkState {
  const factory NeuralNetworkState({
    required String modelId,
    required String version,
    required ModelArchitecture architecture,
    required TrainingState trainingState,
    required ModelMetrics metrics,
    required DateTime lastUpdated,
    required int totalParameters,
    required double sizeInMB,
    required Map<String, LayerState> layers,
    List<String>? supportedFeatures,
  }) = _NeuralNetworkState;

  factory NeuralNetworkState.fromJson(Map<String, dynamic> json) => _$NeuralNetworkStateFromJson(json);
}

@freezed
class ModelArchitecture with _$ModelArchitecture {
  const factory ModelArchitecture({
    required String name,
    required NetworkType type,
    required List<Layer> layers,
    required OptimizerConfig optimizer,
    required LossFunction lossFunction,
    Map<String, dynamic>? hyperparameters,
  }) = _ModelArchitecture;

  factory ModelArchitecture.fromJson(Map<String, dynamic> json) => _$ModelArchitectureFromJson(json);
}

@HiveType(typeId: 11)
enum NetworkType {
  @HiveField(0) snn,           // Spiking Neural Network
  @HiveField(1) ann,           // Artificial Neural Network
  @HiveField(2) cnn,           // Convolutional Neural Network
  @HiveField(3) rnn,           // Recurrent Neural Network
  @HiveField(4) transformer,   // Transformer Network
  @HiveField(5) gan,           // Generative Adversarial Network
  @HiveField(6) quantum,       // Quantum Neural Network
}

@freezed
class Layer with _$Layer {
  const factory Layer({
    required String id,
    required LayerType type,
    required Map<String, dynamic> config,
    required List<int> inputShape,
    required List<int> outputShape,
    required int parameters,
    bool? trainable,
    ActivationFunction? activation,
  }) = _Layer;

  factory Layer.fromJson(Map<String, dynamic> json) => _$LayerFromJson(json);
}

@HiveType(typeId: 12)
enum LayerType {
  @HiveField(0) dense,
  @HiveField(1) conv2d,
  @HiveField(2) maxPooling2d,
  @HiveField(3) dropout,
  @HiveField(4) batchNormalization,
  @HiveField(5) lstm,
  @HiveField(6) gru,
  @HiveField(7) attention,
  @HiveField(8) embedding,
  @HiveField(9) spiking,
}

@HiveType(typeId: 13)
enum ActivationFunction {
  @HiveField(0) relu,
  @HiveField(1) sigmoid,
  @HiveField(2) tanh,
  @HiveField(3) softmax,
  @HiveField(4) leakyRelu,
  @HiveField(5) swish,
  @HiveField(6) gelu,
  @HiveField(7) spike,
}

@freezed
class TrainingState with _$TrainingState {
  const factory TrainingState({
    required bool isTraining,
    required int currentEpoch,
    required int totalEpochs,
    required double currentLoss,
    required double currentAccuracy,
    required Duration elapsedTime,
    required Duration estimatedTimeRemaining,
    required List<TrainingMetric> history,
    TrainingMode? mode,
    String? checkpointPath,
  }) = _TrainingState;

  factory TrainingState.fromJson(Map<String, dynamic> json) => _$TrainingStateFromJson(json);
}

@HiveType(typeId: 14)
enum TrainingMode {
  @HiveField(0) supervised,
  @HiveField(1) unsupervised,
  @HiveField(2) reinforcement,
  @HiveField(3) federated,
  @HiveField(4) transfer,
  @HiveField(5) continual,
}

@freezed
class TrainingMetric with _$TrainingMetric {
  const factory TrainingMetric({
    required int epoch,
    required double loss,
    required double accuracy,
    required double validationLoss,
    required double validationAccuracy,
    required Duration duration,
    Map<String, double>? additionalMetrics,
  }) = _TrainingMetric;

  factory TrainingMetric.fromJson(Map<String, dynamic> json) => _$TrainingMetricFromJson(json);
}

@freezed
class ModelMetrics with _$ModelMetrics {
  const factory ModelMetrics({
    required double accuracy,
    required double precision,
    required double recall,
    required double f1Score,
    required double auc,
    required int truePositives,
    required int trueNegatives,
    required int falsePositives,
    required int falseNegatives,
    required double inferenceLatencyMs,
    required double memoryUsageMB,
    Map<String, double>? classMetrics,
  }) = _ModelMetrics;

  factory ModelMetrics.fromJson(Map<String, dynamic> json) => _$ModelMetricsFromJson(json);
}

// ============ Scan Results ============

@freezed
class ScanResult with _$ScanResult {
  const factory ScanResult({
    required String id,
    required ScanType type,
    required DateTime startedAt,
    required DateTime completedAt,
    required ScanStatus status,
    required List<Threat> threatsFound,
    required List<Vulnerability> vulnerabilities,
    required SystemHealth systemHealth,
    required Map<String, ModuleScanResult> moduleResults,
    required QuantumResistanceReport quantumReport,
    String? errorMessage,
  }) = _ScanResult;

  factory ScanResult.fromJson(Map<String, dynamic> json) => _$ScanResultFromJson(json);
}

@HiveType(typeId: 15)
enum ScanType {
  @HiveField(0) quick,
  @HiveField(1) deep,
  @HiveField(2) neural,
  @HiveField(3) quantum,
  @HiveField(4) network,
  @HiveField(5) file,
  @HiveField(6) app,
  @HiveField(7) system,
}

@HiveType(typeId: 16)
enum ScanStatus {
  @HiveField(0) pending,
  @HiveField(1) running,
  @HiveField(2) completed,
  @HiveField(3) failed,
  @HiveField(4) cancelled,
}

@freezed
class ModuleScanResult with _$ModuleScanResult {
  const factory ModuleScanResult({
    required String moduleName,
    required int itemsScanned,
    required int issuesFound,
    required Duration scanDuration,
    required double confidenceScore,
    List<Finding>? findings,
  }) = _ModuleScanResult;

  factory ModuleScanResult.fromJson(Map<String, dynamic> json) => _$ModuleScanResultFromJson(json);
}

@freezed
class Finding with _$Finding {
  const factory Finding({
    required String id,
    required String title,
    required String description,
    required FindingSeverity severity,
    required String category,
    required String location,
    Map<String, dynamic>? metadata,
  }) = _Finding;

  factory Finding.fromJson(Map<String, dynamic> json) => _$FindingFromJson(json);
}

@HiveType(typeId: 17)
enum FindingSeverity {
  @HiveField(0) info,
  @HiveField(1) low,
  @HiveField(2) medium,
  @HiveField(3) high,
  @HiveField(4) critical,
}

@freezed
class Vulnerability with _$Vulnerability {
  const factory Vulnerability({
    required String id,
    required String cveId,
    required String title,
    required String description,
    required VulnerabilitySeverity severity,
    required double cvssScore,
    required String affectedComponent,
    required DateTime publishedDate,
    DateTime? patchedDate,
    List<String>? references,
    Map<String, dynamic>? exploitInfo,
  }) = _Vulnerability;

  factory Vulnerability.fromJson(Map<String, dynamic> json) => _$VulnerabilityFromJson(json);
}

@HiveType(typeId: 18)
enum VulnerabilitySeverity {
  @HiveField(0) none,
  @HiveField(1) low,
  @HiveField(2) medium,
  @HiveField(3) high,
  @HiveField(4) critical,
}

@freezed
class SystemHealth with _$SystemHealth {
  const factory SystemHealth({
    required int overallScore, // 0-100
    required Map<String, HealthCategory> categories,
    required List<HealthIssue> issues,
    required DateTime lastAssessment,
  }) = _SystemHealth;

  factory SystemHealth.fromJson(Map<String, dynamic> json) => _$SystemHealthFromJson(json);
}

@freezed
class HealthCategory with _$HealthCategory {
  const factory HealthCategory({
    required String name,
    required int score, // 0-100
    required HealthStatus status,
    required List<String> checks,
    Map<String, dynamic>? details,
  }) = _HealthCategory;

  factory HealthCategory.fromJson(Map<String, dynamic> json) => _$HealthCategoryFromJson(json);
}

@HiveType(typeId: 19)
enum HealthStatus {
  @HiveField(0) excellent,
  @HiveField(1) good,
  @HiveField(2) fair,
  @HiveField(3) poor,
  @HiveField(4) critical,
}

@freezed
class HealthIssue with _$HealthIssue {
  const factory HealthIssue({
    required String id,
    required String title,
    required String description,
    required HealthIssueSeverity severity,
    required String category,
    List<String>? recommendations,
  }) = _HealthIssue;

  factory HealthIssue.fromJson(Map<String, dynamic> json) => _$HealthIssueFromJson(json);
}

@HiveType(typeId: 20)
enum HealthIssueSeverity {
  @HiveField(0) minor,
  @HiveField(1) moderate,
  @HiveField(2) major,
  @HiveField(3) severe,
}

// ============ Quantum Computing ============

@freezed
class QuantumResistanceReport with _$QuantumResistanceReport {
  const factory QuantumResistanceReport({
    required String algorithm,
    required QuantumResistanceLevel resistanceLevel,
    required double confidence,
    required List<String> recommendations,
    required bool needsCloudVerification,
    Map<String, dynamic>? analysisDetails,
  }) = _QuantumResistanceReport;

  factory QuantumResistanceReport.fromJson(Map<String, dynamic> json) => _$QuantumResistanceReportFromJson(json);
}

@HiveType(typeId: 21)
enum QuantumResistanceLevel {
  @HiveField(0) quantumSafe,
  @HiveField(1) resistant,
  @HiveField(2) moderate,
  @HiveField(3) vulnerable,
  @HiveField(4) broken,
  @HiveField(5) unknown,
}

@freezed
class QuantumAlgorithmResult with _$QuantumAlgorithmResult {
  const factory QuantumAlgorithmResult({
    required String algorithm,
    required bool isQuantumResistant,
    required double resistanceScore,
    required int qubitsRequired,
    required Duration classicalTime,
    required Duration quantumTime,
    required double speedup,
    List<String>? vulnerabilities,
    List<String>? recommendations,
  }) = _QuantumAlgorithmResult;

  factory QuantumAlgorithmResult.fromJson(Map<String, dynamic> json) => _$QuantumAlgorithmResultFromJson(json);
}

// ============ Performance Metrics ============

@freezed
class PerformanceMetrics with _$PerformanceMetrics {
  const factory PerformanceMetrics({
    required DateTime timestamp,
    required double cpuUsage,
    required double memoryUsageMB,
    required double batteryDrainPercentPerHour,
    required double fps,
    required double inferenceLatencyMs,
    required double networkLatencyMs,
    required double diskUsageMB,
    required ThermalState thermalState,
    required Map<String, double> modelMetrics,
  }) = _PerformanceMetrics;

  factory PerformanceMetrics.fromJson(Map<String, dynamic> json) => _$PerformanceMetricsFromJson(json);
}

@HiveType(typeId: 22)
enum ThermalState {
  @HiveField(0) nominal,
  @HiveField(1) fair,
  @HiveField(2) serious,
  @HiveField(3) critical,
}

// ============ Subscription & Billing ============

@freezed
class SubscriptionPlan with _$SubscriptionPlan {
  const factory SubscriptionPlan({
    required PlanTier tier,
    required DateTime startDate,
    DateTime? endDate,
    required BillingCycle billingCycle,
    required double price,
    required String currency,
    required List<Feature> features,
    required UsageQuota quota,
    bool? autoRenew,
    PaymentMethod? paymentMethod,
  }) = _SubscriptionPlan;

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => _$SubscriptionPlanFromJson(json);
}

@HiveType(typeId: 23)
enum PlanTier {
  @HiveField(0) free,
  @HiveField(1) basic,
  @HiveField(2) professional,
  @HiveField(3) enterprise,
  @HiveField(4) quantum,
}

@HiveType(typeId: 24)
enum BillingCycle {
  @HiveField(0) monthly,
  @HiveField(1) quarterly,
  @HiveField(2) yearly,
  @HiveField(3) lifetime,
}

@freezed
class Feature with _$Feature {
  const factory Feature({
    required String id,
    required String name,
    required String description,
    required bool enabled,
    Map<String, dynamic>? configuration,
  }) = _Feature;

  factory Feature.fromJson(Map<String, dynamic> json) => _$FeatureFromJson(json);
}

@freezed
class UsageQuota with _$UsageQuota {
  const factory UsageQuota({
    required int maxScansPerDay,
    required int maxDevices,
    required double maxStorageGB,
    required int maxTrainingHours,
    required bool unlimitedQuantumScans,
    required bool federatedLearningAccess,
    required bool prioritySupport,
  }) = _UsageQuota;

  factory UsageQuota.fromJson(Map<String, dynamic> json) => _$UsageQuotaFromJson(json);
}

@freezed
class PaymentMethod with _$PaymentMethod {
  const factory PaymentMethod({
    required String id,
    required PaymentType type,
    required String last4,
    required String brand,
    required int expiryMonth,
    required int expiryYear,
    required bool isDefault,
  }) = _PaymentMethod;

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);
}

@HiveType(typeId: 25)
enum PaymentType {
  @HiveField(0) card,
  @HiveField(1) paypal,
  @HiveField(2) applePay,
  @HiveField(3) googlePay,
  @HiveField(4) crypto,
}

// ============ Privacy & Security Settings ============

@freezed
class PrivacySettings with _$PrivacySettings {
  const factory PrivacySettings({
    required bool dataCollection,
    required bool analytics,
    required bool crashReporting,
    required bool federatedLearning,
    required bool locationTracking,
    required DataRetentionPolicy dataRetention,
    required List<String> consentedPurposes,
  }) = _PrivacySettings;

  factory PrivacySettings.fromJson(Map<String, dynamic> json) => _$PrivacySettingsFromJson(json);
}

@freezed
class SecuritySettings with _$SecuritySettings {
  const factory SecuritySettings({
    required bool autoLock,
    required int lockTimeoutMinutes,
    required bool requireBiometric,
    required bool allowScreenshots,
    required bool vpnRequired,
    required List<String> trustedNetworks,
    required ThreatResponseMode threatResponse,
  }) = _SecuritySettings;

  factory SecuritySettings.fromJson(Map<String, dynamic> json) => _$SecuritySettingsFromJson(json);
}

@HiveType(typeId: 26)
enum DataRetentionPolicy {
  @HiveField(0) minimal,      // 30 days
  @HiveField(1) standard,     // 90 days
  @HiveField(2) extended,     // 1 year
  @HiveField(3) permanent,    // Until deletion
}

@HiveType(typeId: 27)
enum ThreatResponseMode {
  @HiveField(0) passive,      // Log only
  @HiveField(1) notify,       // Notify user
  @HiveField(2) block,        // Block automatically
  @HiveField(3) quarantine,   // Quarantine threats
}

// ============ Utility Extensions ============

extension ThreatSeverityExtension on ThreatSeverity {
  double get numericValue {
    switch (this) {
      case ThreatSeverity.low:
        return 0.2;
      case ThreatSeverity.medium:
        return 0.5;
      case ThreatSeverity.high:
        return 0.7;
      case ThreatSeverity.critical:
        return 0.9;
    }
  }

  String get displayName {
    switch (this) {
      case ThreatSeverity.low:
        return 'Low';
      case ThreatSeverity.medium:
        return 'Medium';
      case ThreatSeverity.high:
        return 'High';
      case ThreatSeverity.critical:
        return 'Critical';
    }
  }
}

extension PlanTierExtension on PlanTier {
  String get displayName {
    switch (this) {
      case PlanTier.free:
        return 'Free';
      case PlanTier.basic:
        return 'Basic';
      case PlanTier.professional:
        return 'Professional';
      case PlanTier.enterprise:
        return 'Enterprise';
      case PlanTier.quantum:
        return 'Quantum';
    }
  }

  bool get isPremium => this != PlanTier.free;
}
