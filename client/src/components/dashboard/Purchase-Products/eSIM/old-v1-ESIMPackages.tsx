// import { useState, useMemo, useEffect, memo, SetStateAction } from 'react';
// import { Search, Wifi, Clock, Smartphone, ShoppingCart, Filter, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
// import {
//   useESIMPackages,
//   formatPrice,
//   useESIMCountries,
//   formatDataVolume,
//   formatDuration,
//   getLocationDisplayName,
//   type ESIMPackage,
//   type PackageScope,
// } from '../hooks/useESIMPackages';
// import { City, ISP, ProxyPlan } from './../types';
// import { useDebounce } from 'use-debounce';
// import { ErrorBoundary } from 'react-error-boundary';
// import ReactCountryFlag from 'react-country-flag';

// // Type definitions

// interface CartItem {
//   plan?: ProxyPlan | null;
//   locations?: {
//     isp: ISP | null;
//     city: City | null;
//   };
//   period?: number;
//   protocol?: 'http' | 'socks5';
//   esimPackage?: ESIMPackage | null;
//   quantity?: number;
//   productType: 'proxy' | 'esim';
// }

// const ITEMS_PER_PAGE = 12;

// // Error boundary fallback
// const FallbackComponent = ({ error }: { error: Error }) => (
//   <div className="bg-red-900/50 border border-red-600 rounded-2xl p-6 mb-8 flex items-center gap-3">
//     <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
//       <X className="w-4 h-4 text-white" />
//     </div>
//     <p className="text-red-200 font-medium">Error: {error.message}</p>
//   </div>
// );

// // Simple emoji flag function for dropdown
// const getEmojiFlag = (countryCode: string): string => {
//   if (countryCode === '!GL') return '🌍';
//   if (countryCode === '!RG') return '🌎';

//   try {
//     const codePoints = countryCode.toUpperCase().split('').map(char =>
//       127397 + char.charCodeAt(0)
//     );
//     return String.fromCodePoint(...codePoints);
//   } catch {
//     return '🏳️';
//   }
// };

// // Get country name or fallback
// const getCountryName = (locationCode: string, locationName: string) => {
//   if (locationCode === '!GL') return 'Global';
//   if (locationCode === '!RG') return 'Regional';
//   if (locationCode.includes(',')) {
//     const firstCode = locationCode.split(',')[0].trim();
//     return `${locationName || firstCode}...`;
//   }

//   try {
//     const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
//     return displayNames.of(locationCode.toUpperCase()) || locationName || locationCode;
//   } catch {
//     return locationName || locationCode;
//   }
// };

// function ESIMPackagesPageContent() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
//   const [selectedLocation, setSelectedLocation] = useState('');
//   const [priceRange, setPriceRange] = useState({ min: '', max: '' });
//   const [smsSupport, setSmsSupport] = useState(false);
//   const [dataType, setDataType] = useState<number | undefined>(undefined);
//   const [packageScope, setPackageScope] = useState<PackageScope | ''>('');
//   const [showFilters, setShowFilters] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [cartItems, setCartItems] = useState<CartItem[]>([]);

//   const filters = useMemo(
//     () => ({
//       locationCode: selectedLocation || undefined,
//       search: debouncedSearchTerm || undefined,
//       minPrice: priceRange.min ? parseInt(priceRange.min) * 10000 : undefined,
//       maxPrice: priceRange.max ? parseInt(priceRange.max) * 10000 : undefined,
//       smsSupport,
//       dataType,
//       scope: (packageScope === '' ? undefined : packageScope),
//     }),
//     [debouncedSearchTerm, selectedLocation, priceRange, smsSupport, dataType, packageScope],
//   );

//   const { packages, loading, error } = useESIMPackages(filters);
//   const { countries: countryList } = useESIMCountries();

//   const totalPages = Math.ceil(packages.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const currentPackages = packages.slice(startIndex, endIndex);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [filters]);

//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     const loadCartFromStorage = () => {
//       try {
//         const storedCart = localStorage.getItem('cartItems');
//         if (storedCart) {
//           const parsedCart = JSON.parse(storedCart);
//           if (Array.isArray(parsedCart) && parsedCart.every(item => 'productType' in item)) {
//             const cartWithDefaults = parsedCart.map((item) => ({
//               ...item,
//               protocol: item.protocol || 'http',
//               productType: item.productType || (item.plan ? 'proxy' : 'esim'),
//               quantity: item.quantity || 1,
//             }));
//             setCartItems(cartWithDefaults);
//           } else {
//             console.warn('Invalid cart format in storage');
//             setCartItems([]);
//           }
//         }
//       } catch (e) {
//         console.error('Failed to load cart:', e);
//         setCartItems([]);
//       }
//     };

//     loadCartFromStorage();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'cartItems') {
//         loadCartFromStorage();
//       }
//     };

//     const handleCartUpdate = () => {
//       loadCartFromStorage();
//     };

//     window.addEventListener('storage', handleStorageChange);
//     window.addEventListener('cart-updated', handleCartUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('cart-updated', handleCartUpdate);
//     };
//   }, []);

//   const cleanPackageName = (name: string) => {
//     return name
//       .replace(/\([^)]*\)/g, '')
//       .replace(/\s+\d+\w+\/Day/g, '')
//       .replace(/\s+\d+\.\d+\w+\/Day/g, '')
//       .replace(/\s+\d+\w+$/g, '')
//       .replace(/\s+\d+GB$/g, '')
//       .replace(/\s+\d+Days?$/g, '')
//       .replace(/-\d+\s+\d+\s+Days?$/g, '')
//       .replace(/\s+/g, ' ')
//       .trim();
//   };

//   const getPriceRate = (pkg: ESIMPackage) => {
//     const originalName = pkg.name.toLowerCase();
//     if (originalName.includes('/ day') || originalName.includes('/day') || pkg.data_type === 2) {
//       return '/day';
//     }
//     return `/${formatDataVolume(pkg.volume)}`;
//   };

//   const getDataTypeLabel = (dataType: number) => {
//     switch (dataType) {
//       case 1:
//         return 'Fixed Amount';
//       case 2:
//         return 'Daily Reset';
//       default:
//         return 'Unknown';
//     }
//   };

//   const addToCart = (pkg: ESIMPackage) => {
//     const storedCart = localStorage.getItem('cartItems');
//     let currentCart = [];

//     if (storedCart) {
//       try {
//         const parsedCart = JSON.parse(storedCart);
//         currentCart = Array.isArray(parsedCart) ? parsedCart : [];
//       } catch (e) {
//         console.error('Invalid cart data:', e);
//         currentCart = [];
//       }
//     }

//     const existingItemIndex = currentCart.findIndex(
//       item => item.productType === 'esim' && item.esimPackage?.id === pkg.id,
//     );

//     let updatedCart;
//     if (existingItemIndex >= 0) {
//       updatedCart = currentCart.map((item, index) =>
//         index === existingItemIndex ? { ...item, quantity: (item.quantity || 0) + 1 } : item,
//       );
//     } else {
//       const newItem = {
//         esimPackage: pkg,
//         quantity: 1,
//         productType: 'esim',
//       };
//       updatedCart = [...currentCart, newItem];
//     }

//     localStorage.setItem('cartItems', JSON.stringify(updatedCart));
//     setCartItems(updatedCart);

//     const totalItems = updatedCart.reduce((total, item) => {
//       if (item.productType === 'esim') {
//         return total + (item.quantity || 1);
//       }
//       return total + 1;
//     }, 0);

//     window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
//   };

//   const removeFromCart = (packageId: string) => {
//     const storedCart = localStorage.getItem('cartItems');
//     let currentCart = [];

//     if (storedCart) {
//       try {
//         const parsedCart = JSON.parse(storedCart);
//         currentCart = Array.isArray(parsedCart) ? parsedCart : [];
//       } catch (e) {
//         console.error('Invalid cart data:', e);
//         currentCart = [];
//       }
//     }

//     const updatedCart = currentCart.filter(
//       item => !(item.productType === 'esim' && item.esimPackage?.id === packageId),
//     );

//     localStorage.setItem('cartItems', JSON.stringify(updatedCart));
//     setCartItems(updatedCart);

//     const totalItems = updatedCart.reduce((total, item) => {
//       if (item.productType === 'esim') {
//         return total + (item.quantity || 1);
//       }
//       return total + 1;
//     }, 0);

//     window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
//   };

//   const updateQuantity = (packageId: string, quantity: number) => {
//     if (quantity <= 0) {
//       removeFromCart(packageId);
//       return;
//     }

//     const storedCart = localStorage.getItem('cartItems');
//     let currentCart = [];

//     if (storedCart) {
//       try {
//         const parsedCart = JSON.parse(storedCart);
//         currentCart = Array.isArray(parsedCart) ? parsedCart : [];
//       } catch (e) {
//         console.error('Invalid cart data:', e);
//         currentCart = [];
//       }
//     }

//     const updatedCart = currentCart.map(item =>
//       item.productType === 'esim' && item.esimPackage?.id === packageId ? { ...item, quantity } : item,
//     );

//     localStorage.setItem('cartItems', JSON.stringify(updatedCart));
//     setCartItems(updatedCart);

//     const totalItems = updatedCart.reduce((total, item) => {
//       if (item.productType === 'esim') {
//         return total + (item.quantity || 1);
//       }
//       return total + 1;
//     }, 0);

//     window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
//   };

//   const clearFilters = () => {
//     setSearchTerm('');
//     setSelectedLocation('');
//     setPriceRange({ min: '', max: '' });
//     setSmsSupport(false);
//     setDataType(undefined);
//     setPackageScope('');
//     setCurrentPage(1);
//   };

//   const esimCartItems = cartItems.filter(item => item.productType === 'esim');
//   const esimCartTotal = esimCartItems.reduce(
//     (total, item) => total + ((item.esimPackage?.price || 0) * (item.quantity || 0)),
//     0,
//   );
//   const esimItemCount = esimCartItems.reduce((total, item) => total + (item.quantity || 0), 0);

//   const getCartItemForPackage = (pkg: ESIMPackage) => {
//     return cartItems.find(item => item.productType === 'esim' && item.esimPackage?.id === pkg.id);
//   };

//   const goToPage = (page: SetStateAction<number>) => {
//     setCurrentPage(page);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const renderPaginationButtons = () => {
//     const buttons = [];
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//     let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//     if (endPage - startPage + 1 < maxVisiblePages) {
//       startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }

//     buttons.push(
//       <button
//         key="prev"
//         onClick={() => goToPage(currentPage - 1)}
//         disabled={currentPage === 1}
//         aria-label="Previous page"
//         className="px-3 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors flex items-center gap-1"
//       >
//         <ChevronLeft className="w-4 h-4" />
//         Prev
//       </button>,
//     );

//     for (let i = startPage; i <= endPage; i++) {
//       buttons.push(
//         <button
//           key={i}
//           onClick={() => goToPage(i)}
//           aria-label={`Page ${i}`}
//           className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//             i === currentPage ? 'bg-red-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
//           }`}
//         >
//           {i}
//         </button>,
//       );
//     }

//     buttons.push(
//       <button
//         key="next"
//         onClick={() => goToPage(currentPage + 1)}
//         disabled={currentPage === totalPages}
//         aria-label="Next page"
//         className="px-3 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors flex items-center gap-1"
//       >
//         Next
//         <ChevronRight className="w-4 h-4" />
//       </button>,
//     );

//     return buttons;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       {/* Header */}
//       <div className="bg-slate-800 shadow-xl border-b border-slate-700">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//             <div>
//               <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
//                 <Smartphone className="w-10 h-10 text-red-500" />
//                 eSIM Data Plans
//               </h1>
//               <p className="text-slate-300 text-lg">
//                 Choose from <span className="font-semibold text-green-400">{packages.length}</span> available data plans
//                 worldwide
//               </p>
//             </div>
//             {esimItemCount > 0 && (
//               <div className="bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-500 rounded-2xl p-6 shadow-xl">
//                 <div className="flex items-center gap-3 mb-3">
//                   <ShoppingCart className="h-6 w-6 text-green-400" />
//                   <span className="font-bold text-white text-lg">
//                     {esimItemCount} eSIM{esimItemCount !== 1 ? 's' : ''}
//                   </span>
//                 </div>
//                 <div className="text-3xl font-bold text-green-400 mb-4">
//                   ${(esimCartTotal / 10000).toFixed(2)}
//                 </div>
//                 <button
//                   onClick={() => window.location.href = '/dashboard/cart'}
//                   className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
//                   aria-label="View cart"
//                 >
//                   View Cart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Filters Section */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-bold text-white flex items-center gap-2">
//               <Filter className="w-5 h-5 text-red-500" />
//               Filters
//             </h2>
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
//               aria-label={showFilters ? 'Hide filters' : 'Show filters'}
//             >
//               <span className="text-sm font-medium">{showFilters ? 'Hide' : 'Show'} Filters</span>
//               <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
//             </button>
//           </div>

//           <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
//               {/* Search */}
//               <div className="lg:col-span-2">
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="search-plans">
//                   Search Plans
//                 </label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
//                   <input
//                     id="search-plans"
//                     type="text"
//                     placeholder="Search by country, plan name..."
//                     value={searchTerm}
//                     onChange={e => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
//                     aria-label="Search eSIM plans"
//                   />
//                 </div>
//               </div>

//               {/* Location Filter */}
//               <div>
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="location-filter">
//                   Location
//                 </label>
//                 <select
//                   id="location-filter"
//                   value={selectedLocation}
//                   onChange={e => setSelectedLocation(e.target.value)}
//                   className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none cursor-pointer transition-all text-sm"
//                   aria-label="Select location"
//                 >
//                   <option value="">All Locations</option>
//                   <option value="!GL">🌍 Global</option>
//                   <option value="!RG">🌎 Regional</option>
//                   <option disabled>──────────</option>
//                   {countryList.map((country) => {
//                     // Convert country code to country name
//                     let countryName;
//                     try {
//                       const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
//                       countryName = displayNames.of(country.location_code.toUpperCase()) || country.display_name || country.location_name || country.location_code;
//                     } catch {
//                       countryName = country.display_name || country.location_name || country.location_code;
//                     }

//                     return (
//                       <option key={country.location_code} value={country.location_code}>
//                         {getEmojiFlag(country.location_code)} {countryName}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>

//               {/* Package Scope */}
//               <div>
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="coverage-type">
//                   Coverage Type
//                 </label>
//                 <select
//                   id="coverage-type"
//                   value={packageScope}
//                   onChange={e => setPackageScope(e.target.value as '' | PackageScope)}
//                   className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
//                   aria-label="Select coverage type"
//                 >
//                   <option value="">All Types</option>
//                   <option value="global">🌍 Global Coverage</option>
//                   <option value="regional">🌎 Multi-Country</option>
//                   <option value="country">🇺🇳 Single Country</option>
//                 </select>
//               </div>

//               {/* Min Price */}
//               <div>
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="min-price">
//                   Min Price (USD)
//                 </label>
//                 <input
//                   id="min-price"
//                   type="number"
//                   placeholder="Min"
//                   value={priceRange.min}
//                   onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
//                   className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
//                   aria-label="Minimum price"
//                 />
//               </div>

//               {/* Max Price */}
//               <div>
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="max-price">
//                   Max Price (USD)
//                 </label>
//                 <input
//                   id="max-price"
//                   type="number"
//                   placeholder="Max"
//                   value={priceRange.max}
//                   onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
//                   className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
//                   aria-label="Maximum price"
//                 />
//               </div>

//               {/* Data Type */}
//               <div>
//                 <label className="block text-sm font-semibold text-white mb-2" htmlFor="data-type">
//                   Data Type
//                 </label>
//                 <select
//                   id="data-type"
//                   value={dataType || ''}
//                   onChange={e => setDataType(e.target.value ? parseInt(e.target.value) : undefined)}
//                   className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
//                   aria-label="Select data type"
//                 >
//                   <option value="">All Types</option>
//                   <option value="1">Fixed Amount</option>
//                   <option value="2">Daily Reset</option>
//                 </select>
//               </div>

//               {/* SMS Support */}
//               <div className="flex items-end">
//                 <label className="flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={smsSupport}
//                     onChange={e => setSmsSupport(e.target.checked)}
//                     className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500 focus:ring-offset-slate-800"
//                     aria-label="SMS support"
//                   />
//                   <span className="ml-2 text-white font-medium text-sm">SMS Support</span>
//                 </label>
//               </div>
//             </div>

//             {/* Clear Filters */}
//             <div className="flex justify-end">
//               <button
//                 onClick={clearFilters}
//                 className="flex items-center justify-center px-4 py-2 border border-slate-600 rounded-xl font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-all duration-200 hover:scale-105 text-sm"
//                 aria-label="Clear all filters"
//               >
//                 <X className="h-4 w-4 mr-2" />
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
//         {error && (
//           <div className="bg-red-900/50 border border-red-600 rounded-2xl p-6 mb-8 flex items-center gap-3">
//             <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
//               <X className="w-4 h-4 text-white" />
//             </div>
//             <p className="text-red-200 font-medium">Error loading packages: {error}</p>
//           </div>
//         )}

//         {loading ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {[...Array(12)].map((_, i) => (
//               <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 animate-pulse">
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="space-y-2">
//                     <div className="h-5 bg-slate-600 rounded w-32"></div>
//                     <div className="h-4 bg-slate-600 rounded w-24"></div>
//                   </div>
//                   <div className="h-8 bg-slate-600 rounded w-16"></div>
//                 </div>
//                 <div className="space-y-3 mb-6">
//                   {[...Array(4)].map((_, j) => (
//                     <div key={j} className="flex justify-between">
//                       <div className="h-4 bg-slate-600 rounded w-20"></div>
//                       <div className="h-4 bg-slate-600 rounded w-16"></div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="h-10 bg-slate-600 rounded"></div>
//               </div>
//             ))}
//           </div>
//         ) : packages.length === 0 ? (
//           <div className="text-center py-20">
//             <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 max-w-md mx-auto">
//               <Smartphone className="mx-auto h-16 w-16 text-slate-500 mb-6" />
//               <h3 className="text-2xl font-bold text-white mb-3">No packages found</h3>
//               <p className="text-slate-400 mb-6">Try adjusting your filters or search terms to find more options.</p>
//               <button
//                 onClick={clearFilters}
//                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
//                 aria-label="Clear all filters"
//               >
//                 Clear All Filters
//               </button>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
//               {currentPackages.map((pkg) => {
//                 const cartItem = getCartItemForPackage(pkg);
//                 const inCart = !!cartItem;

//                 return (
//                   <div
//                     key={pkg.id}
//                     className="group relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl border border-slate-700 hover:border-slate-600 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col"
//                   >
//                     {/* Card Header */}
//                     <div className="relative p-6 pb-4 flex-shrink-0">
//                       <div className="flex items-center justify-end mb-4">
//                         {pkg.packageType === 'topup' && (
//                           <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-2 py-1 rounded-full text-xs font-bold">
//                             TOP-UP
//                           </div>
//                         )}
//                       </div>

//                       <div className="mb-4">
//                         <div className="flex items-center justify-between align-items-start mb-2">
//                           <h3 className="text-xl font-bold text-white leading-tight group-hover:text-slate-100 transition-colors flex-1 pr-3">
//                             {(() => {
//                               if (pkg.scope === 'country') {
//                                 return getCountryName(pkg.location_code, pkg.location_name);
//                               }
//                               const isGlobal = /global\d*/i.test(pkg.name);
//                               if (isGlobal) {
//                                 return 'Global';
//                               }
//                               const cleanName = cleanPackageName(pkg.name);
//                               return cleanName;
//                             })()}
//                           </h3>
//                           <span className="text-2xl flex-shrink-0">
//                             {pkg.scope === 'global' ? '🌍' : pkg.scope === 'regional' ? '🌎' : (
//                               <ReactCountryFlag
//                                 countryCode={pkg.location_code.split(',')[0].trim()}
//                                 svg
//                                 style={{ fontSize: '1.5rem' }}
//                               />
//                             )}
//                           </span>
//                         </div>
//                         <div className="flex items-center text-slate-400 text-sm">
//                           <span className="truncate">
//                             {getLocationDisplayName(pkg.location_code, pkg.location_name)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-2xl p-4 border border-slate-600/50">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <div className="text-3xl font-black text-green-400 leading-none">
//                               {formatPrice(pkg.price, pkg.currency_code)}
//                             </div>
//                             <div className="text-slate-400 text-sm font-medium mt-1">{getPriceRate(pkg)}</div>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-slate-300 text-xs uppercase tracking-wider font-bold">
//                               {pkg.currency_code}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Card Body */}
//                     <div className="px-6 pb-6 flex-grow flex flex-col">
//                       <div className="grid grid-cols-2 gap-3 mb-6 flex-grow">
//                         <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
//                           <div className="flex items-center gap-2 mb-1">
//                             <Wifi className="h-4 w-4 text-blue-400" />
//                             <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Data</span>
//                           </div>
//                           <div className="text-white font-bold text-sm">{formatDataVolume(pkg.volume)}</div>
//                         </div>

//                         <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
//                           <div className="flex items-center gap-2 mb-1">
//                             <Clock className="h-4 w-4 text-purple-400" />
//                             <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Validity</span>
//                           </div>
//                           <div className="text-white font-bold text-sm">
//                             {formatDuration(pkg.duration, pkg.duration_unit)}
//                           </div>
//                         </div>

//                         <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
//                           <div className="flex items-center gap-2 mb-1">
//                             <div className="h-4 w-4 bg-orange-400 rounded-full flex items-center justify-center">
//                               <div className="h-2 w-2 bg-slate-800 rounded-full"></div>
//                             </div>
//                             <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Type</span>
//                           </div>
//                           <div className="text-white font-bold text-sm">{getDataTypeLabel(pkg.data_type)}</div>
//                         </div>

//                         <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
//                           <div className="flex items-center gap-2 mb-1">
//                             <Smartphone className="h-4 w-4 text-pink-400" />
//                             <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">SMS</span>
//                           </div>
//                           <div className={`font-medium text-sm ${pkg.sms_status > 0 ? 'text-green-400' : 'text-slate-500'}`}>
//                             {pkg.sms_status > 0 ? 'Yes' : 'No'}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-3 mt-auto">
//                         {inCart ? (
//                           <>
//                             <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-2xl p-3 border bg-slate-600">
//                               <button
//                                 onClick={() => updateQuantity(pkg.id, (cartItem?.quantity || 1) - 1)}
//                                 className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold transition-all duration-200 hover:scale-105"
//                                 aria-label={`Decrease quantity for ${cleanPackageName(pkg.name)}`}
//                               >
//                                 −
//                               </button>
//                               <div className="flex-1 text-center">
//                                 <span className="text-xl font-bold text-white">{cartItem?.quantity || 0}</span>
//                                 <div className="text-blue-400 text-xs font-medium">in cart</div>
//                               </div>
//                               <button
//                                 onClick={() => updateQuantity(pkg.id, (cartItem?.quantity || 0) + 1)}
//                                 className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold transition-all duration-200 hover:scale-105"
//                                 aria-label={`Increase quantity for ${cleanPackageName(pkg.name)}`}
//                               >
//                                 +
//                               </button>
//                             </div>
//                             <button
//                               onClick={() => removeFromCart(pkg.id)}
//                               className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-2xl font-bold transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl"
//                               aria-label={`Remove ${cleanPackageName(pkg.name)} from cart`}
//                             >
//                               Remove from Cart
//                             </button>
//                           </>
//                         ) : (
//                           <button
//                             onClick={() => addToCart(pkg)}
//                             className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl group"
//                             aria-label={`Add ${cleanPackageName(pkg.name)} to cart`}
//                           >
//                             <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
//                             Add to Cart
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-600/0 via-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:via-red-600/0 group-hover:to-red-600/5 transition-all duration-300 pointer-events-none"></div>
//                   </div>
//                 );
//               })}
//             </div>

//             {totalPages > 1 && (
//               <div className="flex justify-center gap-2 mt-6">{renderPaginationButtons()}</div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default memo(function ESIMPackagesPage() {
//   return (
//     <ErrorBoundary FallbackComponent={FallbackComponent}>
//       <ESIMPackagesPageContent />
//     </ErrorBoundary>
//   );
// });
