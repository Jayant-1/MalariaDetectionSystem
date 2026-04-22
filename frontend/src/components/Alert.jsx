import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const Alert = ({ type = "info", title, message, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgClass: "bg-green-50 dark:bg-green-900/20",
      borderClass: "border-green-500 dark:border-green-600",
      textClass: "text-green-700 dark:text-green-400",
      iconColor: "text-green-600 dark:text-green-500",
    },
    error: {
      icon: XCircle,
      bgClass: "bg-red-50 dark:bg-red-900/20",
      borderClass: "border-red-500 dark:border-red-600",
      textClass: "text-red-700 dark:text-red-400",
      iconColor: "text-red-600 dark:text-red-500",
    },
    warning: {
      icon: AlertCircle,
      bgClass: "bg-yellow-50 dark:bg-yellow-900/20",
      borderClass: "border-yellow-500 dark:border-yellow-600",
      textClass: "text-yellow-700 dark:text-yellow-400",
      iconColor: "text-yellow-600 dark:text-yellow-500",
    },
    info: {
      icon: Info,
      bgClass: "bg-blue-50 dark:bg-blue-900/20",
      borderClass: "border-blue-500 dark:border-blue-600",
      textClass: "text-blue-700 dark:text-blue-400",
      iconColor: "text-blue-600 dark:text-blue-500",
    },
  };

  const {
    icon: Icon,
    bgClass,
    borderClass,
    textClass,
    iconColor,
  } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${bgClass} ${borderClass} border-l-4 p-4 rounded-lg shadow-md`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold ${textClass} mb-1`}>{title}</h4>
          )}
          <div className={`text-sm ${textClass} whitespace-pre-line`}>
            {message}
          </div>
        </div>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`${textClass} hover:opacity-70`}
          >
            <XCircle className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default Alert;
