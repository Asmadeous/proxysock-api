import {
  MagnifyingGlassIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Category {
  name: string;
  count: number;
}

interface BlogSearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  isLoadingNews: boolean;
  onRefreshNews: () => void;
}

export function BlogSearchFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isLoadingNews,
  onRefreshNews,
}: BlogSearchFilterProps) {
  return (
    <div className="bg-card/30 backdrop-blur-sm border-b border-border sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Modern Category Tabs */}
          <div className="flex flex-col gap-4">
            <Tabs
              value={selectedCategory}
              onValueChange={onCategoryChange}
              className="w-full"
            >
              <div className="flex justify-center">
                <TabsList className="bg-muted p-1 h-auto rounded-xl sm:rounded-full flex flex-wrap justify-center gap-1 sm:gap-0 min-h-[44px]">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.name}
                      value={category.name}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg sm:rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-shrink-0"
                    >
                      {category.name === "News" && (
                        <NewspaperIcon className="h-4 w-4" />
                      )}
                      <span>{category.name}</span>
                      <span className="bg-muted-foreground/20 text-muted-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-normal data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
                        {category.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            {/* Enhanced Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mx-auto items-stretch sm:items-center">
              <div className="relative group flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search articles, guides, and news..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                />
              </div>
              {/* Refresh News Button - Only show for News tab */}
              {selectedCategory === "News" && (
                <button
                  onClick={onRefreshNews}
                  disabled={isLoadingNews}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-card/80 border border-border text-card-foreground rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-md text-sm font-medium sm:w-auto w-full"
                >
                  {isLoadingNews ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <NewspaperIcon className="h-4 w-4" />
                      <span>Refresh News</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
