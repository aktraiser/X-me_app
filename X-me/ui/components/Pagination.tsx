import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculer les indices d'affichage
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    
    // Logique pour déterminer quelles pages afficher
    if (totalPages <= 7) {
      // Moins de 7 pages, montrer toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Plus de 7 pages, montrer un sous-ensemble avec des ellipses
      if (currentPage <= 3) {
        // Près du début
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages - 1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Près de la fin
        pages.push(1);
        pages.push(2);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // Quelque part au milieu
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-dark-200 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-dark-300 bg-white dark:bg-dark-200 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-dark-300 disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-dark-300 bg-white dark:bg-dark-200 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-dark-300 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-white/70">
            Affichage de <span className="font-medium">{startItem}</span> à <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{totalItems}</span> résultats
          </p>
        </div>
        <div>
          <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-white/50 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-50 dark:hover:bg-dark-300 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Précédent</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            
            {pageNumbers.map((page, index) => 
              page === 'ellipsis' ? (
                <span 
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white/70 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 focus:outline-offset-0"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(Number(page))}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === page 
                      ? 'z-10 bg-orange-600 dark:bg-orange-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600' 
                      : 'text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-50 dark:hover:bg-dark-300 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-white/50 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-50 dark:hover:bg-dark-300 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Suivant</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination; 