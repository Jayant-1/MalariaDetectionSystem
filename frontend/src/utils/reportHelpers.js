/**
 * Helper utilities for report generation
 */

/**
 * Format test result data for doctor PDF report
 * Enriches basic test data with formatted fields for PDF generation
 */
export const formatTestForDoctorReport = (test, doctorProfile) => {
  return {
    patientName: test.patientName || "Unknown Patient",
    patientId: test.patientId || test.id || "N/A",
    testDate: test.testDate || new Date().toLocaleDateString(),
    testType: test.testType || "Malaria Detection Test",
    result: test.result || "Pending",
    confidence: test.confidence || 0,
    status: test.status || "Completed",
    doctorName: doctorProfile?.full_name || "Doctor",
    hospital: doctorProfile?.hospital || "Medical Center",

    // ML prediction details (from backend prediction data)
    predictedClass: test.predictedClass || test.predicted_class || test.result,
    parasitizedProb:
      test.parasitizedProb || test.parasitized_probability || "N/A",
    uninfectedProb: test.uninfectedProb || test.uninfected_probability || "N/A",
    imageQuality: test.imageQuality || test.image_quality || "Good",

    // Additional notes
    additionalNotes: test.notes || test.additional_notes || "",
  };
};

/**
 * Format test result data for patient PDF report
 * Enriches basic test data with formatted fields for PDF generation
 */
export const formatTestForPatientReport = (test) => {
  return {
    date: test.date || test.testDate || new Date().toLocaleDateString(),
    testType: test.testType || "Malaria Detection Test",
    result: test.result || "Pending",
    confidence: test.confidence || 0,
    status: test.status || "Completed",
    doctor: test.doctor || test.doctorName || "Doctor",
    hospital: test.hospital || "Medical Center",

    // ML prediction details (from backend prediction data)
    predictedClass: test.predictedClass || test.predicted_class || test.result,
    parasitizedProb:
      test.parasitizedProb || test.parasitized_probability || "N/A",
    uninfectedProb: test.uninfectedProb || test.uninfected_probability || "N/A",
    imageQuality: test.imageQuality || test.image_quality || "Good",
  };
};

/**
 * Extract probability data from ML result
 * Transforms various probability formats into consistent format
 */
export const extractProbabilities = (mlResult) => {
  if (!mlResult) return { parasitizedProb: "N/A", uninfectedProb: "N/A" };

  const probabilities = mlResult.probabilities || {};

  const parasitizedProb = probabilities.Parasitized
    ? `${(probabilities.Parasitized * 100).toFixed(2)}%`
    : probabilities.parasitized
    ? `${(probabilities.parasitized * 100).toFixed(2)}%`
    : "N/A";

  const uninfectedProb = probabilities.Uninfected
    ? `${(probabilities.Uninfected * 100).toFixed(2)}%`
    : probabilities.uninfected
    ? `${(probabilities.uninfected * 100).toFixed(2)}%`
    : "N/A";

  return { parasitizedProb, uninfectedProb };
};
