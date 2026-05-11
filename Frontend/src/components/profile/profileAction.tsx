import { Edit3, Save, X, Loader } from "lucide-react";
import { useDarkMode } from "../../contexts/DarkModeContext";

type Props = {
  isEditing: boolean;
  uploading?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileActions({ isEditing, uploading = false, onEdit, onSave, onCancel }: Props) {
  const { darkMode } = useDarkMode();
  const dm = darkMode;

  if (!isEditing) {
    return (
      <button
        onClick={onEdit}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          dm
            ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
        }`}
      >
        <Edit3 className="w-4 h-4" />
        Edit Profile
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onCancel}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          dm
            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <X className="w-4 h-4" /> Cancel
      </button>
      <button
        onClick={onSave}
        disabled={uploading}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save
      </button>
    </div>
  );
}
