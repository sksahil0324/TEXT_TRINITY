export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">TextPro NLP Platform</h3>
            <p className="text-xs text-gray-600">Powerful text processing tools powered by advanced language models.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><a href="#" className="hover:text-primary">Translation</a></li>
                <li><a href="#" className="hover:text-primary">Summarization</a></li>
                <li><a href="#" className="hover:text-primary">Content Generation</a></li>
                <li><a href="#" className="hover:text-primary">Keyword Extraction</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Resources</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><a href="#" className="hover:text-primary">Documentation</a></li>
                <li><a href="#" className="hover:text-primary">API Reference</a></li>
                <li><a href="#" className="hover:text-primary">Tutorials</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Company</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} TextPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
