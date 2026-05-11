import {
  X,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  Tag,
  Heart,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { Job } from "../types";

interface JobModalProps {
  job: Job;
  darkMode: boolean;
  onClose: () => void;
  onSave: (jobId: number) => void;
  onApply: (job: Job) => void;
}

export function JobModal({
  job,
  darkMode,
  onClose,
  onSave,
  onApply,
}: JobModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-3xl rounded-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>{job.title}</h2>
            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              <span>{job.company}</span>
              <span className="hidden sm:inline">•</span>
              <span>{job.posted}</span>
              <span className="hidden sm:inline">•</span>
              <span>{job.applicants} applicants</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg self-end ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Job Description</h3>
            <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
              {job.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Job Details</h3>
              <div className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: {job.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {job.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Type: {job.remote ? "Remote" : "On-site"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>Experience: {job.experience}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(job.skills ?? []).map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm rounded-full ${
                      darkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {job.status !== "applied" ? (
              <>
                <Button
                  onClick={() => {
                    onApply(job);
                    onClose();
                  }}
                  className="bg-gradient-to-r from-[#0084ca] to-[#006ba6] hover:from-[#006ba6] hover:to-[#005a8a] text-white w-full sm:w-auto"
                >
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onSave(job.id)}
                  className="w-full sm:w-auto"
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${job.status === "saved" ? "fill-current" : ""}`}
                  />
                  {job.status === "saved" ? "Unsave" : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                disabled
                className="text-green-600 border-green-600 w-full sm:w-auto"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Already Applied
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
