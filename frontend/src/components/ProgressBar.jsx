import { motion } from "framer-motion";

const ProgressBar = ({
  progress,
  label,
  color = "primary",
  showLabel = true,
}) => {
  const colorClasses = {
    primary: "from-primary-500 to-primary-600",
    teal: "from-teal-500 to-teal-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || "Progress"}
          </span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {progress}%
          </span>
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
