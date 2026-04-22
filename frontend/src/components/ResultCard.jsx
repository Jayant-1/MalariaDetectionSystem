import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const ResultCard = ({ status, confidence, details, timestamp, imageUrl }) => {
  const statusConfig = {
    healthy: {
      color: "green",
      icon: CheckCircle,
      title: "Negative Result",
      message: "No malaria parasites detected",
      bgClass: "bg-green-50 dark:bg-green-900/20",
      borderClass: "border-green-500 dark:border-green-600",
      textClass: "text-green-700 dark:text-green-400",
    },
    infected: {
      color: "red",
      icon: XCircle,
      title: "Positive Result",
      message: "Malaria parasites detected",
      bgClass: "bg-red-50 dark:bg-red-900/20",
      borderClass: "border-red-500 dark:border-red-600",
      textClass: "text-red-700 dark:text-red-400",
    },
    uncertain: {
      color: "yellow",
      icon: AlertTriangle,
      title: "Uncertain Result",
      message: "Further testing recommended",
      bgClass: "bg-yellow-50 dark:bg-yellow-900/20",
      borderClass: "border-yellow-500 dark:border-yellow-600",
      textClass: "text-yellow-700 dark:text-yellow-400",
    },
  };

  const config = statusConfig[status] || statusConfig.uncertain;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border-2 ${config.borderClass} ${config.bgClass} p-6 shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${config.bgClass}`}>
            <Icon className={`w-8 h-8 ${config.textClass}`} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${config.textClass}`}>
              {config.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {config.message}
            </p>
          </div>
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
      </div>

      {/* Confidence Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confidence Level
          </span>
          <span className={`text-sm font-bold ${config.textClass}`}>
            {confidence}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${
              status === "healthy"
                ? "from-green-500 to-green-600"
                : status === "infected"
                ? "from-red-500 to-red-600"
                : "from-yellow-500 to-yellow-600"
            }`}
          />
        </div>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Analyzed Image
          </p>
          <img
            src={imageUrl}
            alt="Analyzed sample"
            className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}

      {/* Details */}
      {details && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Analysis Details
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResultCard;
