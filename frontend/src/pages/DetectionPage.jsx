import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle,
  Download,
  Share2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Button from "../components/Button";
import ImageUpload from "../components/ImageUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressBar from "../components/ProgressBar";
import ResultCard from "../components/ResultCard";
import { useAuth } from "../contexts/AuthContext";
import { mlService, predictionService, testService } from "../services";
import { generateDoctorReport } from "../utils/pdfGenerator";
import { formatTestForDoctorReport } from "../utils/reportHelpers";

const DetectionPage = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleUpload = (file, preview) => {
    setUploadedFile(file);
    setUploadedImage(preview);
    setResult(null);
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // Progress simulation for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 400);

      // Use predictionService for complete flow (ML API + DB save)
      const { data: result, error: predictionError } =
        await predictionService.createPrediction({
          imageFile: uploadedFile,
          patientId: 1, // TODO: Replace with actual patient selection
          doctorId: profile?.role === "doctor" ? profile.id : null,
          useDetailed: true,
          useTTA: false,
        });

      clearInterval(progressInterval);
      setProgress(100);

      if (predictionError) {
        throw new Error(predictionError.message || "Failed to analyze image");
      }

      // Transform API response to application format
      const transformedResult = mlService.transformDetailedPrediction(
        result,
        uploadedImage
      );

      // Save test result to database
      try {
        const testResult = {
          patient_id: 1, // TODO: Replace with actual patient selection
          doctor_id:
            profile?.role === "doctor" || profile?.role === "admin"
              ? user.id
              : null,
          result:
            transformedResult.status === "infected" ? "positive" : "negative",
          confidence: transformedResult.confidence,
          status: "completed",
          parasite_species:
            transformedResult.details?.predicted_class || "General",
          image_url: result.storage_url || uploadedImage,
          parasitized_probability:
            transformedResult.details?.parasitized_probability || null,
          uninfected_probability:
            transformedResult.details?.uninfected_probability || null,
          image_quality: transformedResult.details?.image_quality || "Good",
          additional_notes: `Analysis performed on ${new Date().toLocaleString()}`,
        };

        const { data: savedTest, error: saveError } =
          await testService.createTest(testResult);

        if (saveError) {
          console.error("Failed to save test result:", saveError);
        } else {
          console.log("✅ Test result saved to database:", savedTest);
          // Store the test ID in the result for later use
          transformedResult.testId = savedTest.id;
        }
      } catch (saveErr) {
        console.error("Error saving test result:", saveErr);
        // Don't block the UI if database save fails
      }

      setTimeout(() => {
        setResult(transformedResult);
        setIsAnalyzing(false);
      }, 500);
    } catch (err) {
      console.error("Analysis error:", err);

      // Enhanced error message for LocalTunnel issues
      let errorMessage = err.message || "An error occurred during analysis";

      if (
        errorMessage.includes("LocalTunnel") ||
        errorMessage.includes("407") ||
        errorMessage.includes("511")
      ) {
        errorMessage = `⚠️ LocalTunnel Setup Required:\n\n1. Open ${
          import.meta.env.VITE_ML_API_URL
        } in a new browser tab\n2. Click 'Continue' on the LocalTunnel landing page\n3. Return here and try again\n\nNote: LocalTunnel requires this one-time browser verification per session.`;
      } else if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "Cannot connect to AI server. Please ensure the FastAPI server is running and accessible.";
      }

      setError(errorMessage);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const resetAnalysis = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setResult(null);
    setProgress(0);
    setIsAnalyzing(false);
    setError(null);
  };

  const handleDownloadReport = () => {
    if (!result) return;

    // Prepare test data for PDF report
    const testData = formatTestForDoctorReport(
      {
        id: result.testId || null, // Use saved test ID if available
        patientName: "Patient", // TODO: Replace with actual patient name when patient selection is implemented
        patientId: "TMP-001", // Temporary ID
        testDate: new Date().toLocaleDateString(),
        testType: "Malaria Detection Test",
        result: result.status === "infected" ? "Positive" : "Negative",
        confidence: result.confidence,
        status: "Completed",
        predictedClass: result.details?.predicted_class || result.status,
        parasitizedProb: result.details?.parasitized_probability || "N/A",
        uninfectedProb: result.details?.uninfected_probability || "N/A",
        imageQuality: result.details?.image_quality || "Good",
        notes: result.testId
          ? `Test ID: ${
              result.testId
            } - Analysis performed on ${new Date().toLocaleString()}`
          : `Analysis performed on ${new Date().toLocaleString()}`,
      },
      profile
    );

    // Generate PDF report
    generateDoctorReport(testData);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                AI Malaria Detection
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload a blood sample image for instant analysis
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Upload Section */}
              <div className="glass-panel rounded-xl p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Upload Blood Sample Image
                </h2>
                <ImageUpload onUpload={handleUpload} maxSize={10} />
              </div>

              {/* Analysis Section */}
              {uploadedImage && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-xl p-8"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ready for Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your image has been uploaded successfully. Click the button
                    below to start AI analysis.
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      onClick={startAnalysis}
                      variant="primary"
                      size="lg"
                      icon={<Brain className="w-5 h-5" />}
                    >
                      Start AI Analysis
                    </Button>
                    <Button onClick={resetAnalysis} variant="outline" size="lg">
                      Upload Different Image
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Analyzing Section */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel rounded-xl p-8"
                >
                  <div className="text-center mb-8">
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        },
                        scale: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 mb-6"
                    >
                      <Brain className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      Analyzing Sample...
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Our AI is examining your blood sample image
                    </p>
                  </div>

                  <ProgressBar
                    progress={progress}
                    label="Analysis Progress"
                    color="primary"
                  />

                  <div className="mt-8 space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: progress >= 25 ? 1 : 0.3, x: 0 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          progress >= 25
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Image preprocessing complete
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: progress >= 50 ? 1 : 0.3, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          progress >= 50
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Blood cells identified
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: progress >= 75 ? 1 : 0.3, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          progress >= 75
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Parasite detection in progress
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: progress >= 100 ? 1 : 0.3, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          progress >= 100
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Generating final report
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Information Cards */}
              {!uploadedImage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  >
                    <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      AI-Powered
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Advanced deep learning models trained on thousands of
                      samples
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      98% Accurate
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clinically validated accuracy comparable to expert
                      pathologists
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                  >
                    <AlertTriangle className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Instant Results
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get diagnostic results in seconds, not hours or days
                    </p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ResultCard {...result} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-col sm:flex-row gap-4"
              >
                <Button
                  onClick={resetAnalysis}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  icon={<Brain className="w-5 h-5" />}
                >
                  Analyze Another Sample
                </Button>
                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  size="lg"
                  icon={<Download className="w-5 h-5" />}
                >
                  Download Report
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  icon={<Share2 className="w-5 h-5" />}
                >
                  Share Results
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DetectionPage;
