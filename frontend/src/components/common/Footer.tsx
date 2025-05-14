const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white shadow-sm dark:bg-gray-800 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {currentYear} Binventory. All rights reserved.</p>
          <p className="mt-2">An inventory management system for your home items.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
