interface ProcessingStateProps {
  title: string;
  message: string;
}

export default function ProcessingState({ title, message }: ProcessingStateProps) {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="loader rounded-full border-4 border-gray-200 h-12 w-12"></div>
        </div>
        <h3 className="text-lg font-medium text-center mb-2">{title}</h3>
        <p className="text-gray-600 text-center text-sm">{message}</p>
      </div>
    </div>
  );
}
