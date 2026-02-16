// import { Fragment, useState } from "react";
// import { Menu, Transition } from "@headlessui/react";
// import { BellIcon } from "@heroicons/react/24/outline";
// import { useQuery } from "@tanstack/react-query";
// import { markAsRead, getMockNotifications } from "../services/notificationService";
// import { classNames } from "../utils/classNames";

// export default function NotificationCenter() {
//   const [unreadCount, setUnreadCount] = useState(0);

//   // Use mock data during development
//   const { data: notifications = [] } = useQuery(["notifications"], getMockNotifications, {
//     onSuccess: (data) => {
//       setUnreadCount(data.filter((n: any) => !n.read).length);
//     },
//   });

//   const handleMarkAsRead = async (id: string) => {
//     await markAsRead(id);
//     setUnreadCount((prev) => Math.max(0, prev - 1));
//   };

//   return (
//     <Menu as="div" className="relative inline-block text-left">
//       <div>
//         <Menu.Button className="relative inline-flex items-center p-2 text-gray-400 hover:text-white">
//           <BellIcon className="h-6 w-6" aria-hidden="true" />
//           {unreadCount > 0 && (
//             <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-gray-800" />
//           )}
//         </Menu.Button>
//       </div>

//       <Transition
//         as={Fragment}
//         enter="transition ease-out duration-100"
//         enterFrom="transform opacity-0 scale-95"
//         enterTo="transform opacity-100 scale-100"
//         leave="transition ease-in duration-75"
//         leaveFrom="transform opacity-100 scale-100"
//         leaveTo="transform opacity-0 scale-95">
//         <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//           <div className="py-1">
//             {notifications.length === 0 ? (
//               <div className="px-4 py-3 text-sm text-gray-400">No new notifications</div>
//             ) : (
//               notifications.map((notification: any) => (
//                 <Menu.Item key={notification._id}>
//                   {({ active }) => (
//                     <div
//                       className={classNames(
//                         active ? "bg-gray-700" : "",
//                         "px-4 py-3 cursor-pointer"
//                       )}
//                       onClick={() => handleMarkAsRead(notification._id)}>
//                       <p className="text-sm font-medium text-white">{notification.title}</p>
//                       <p className="text-sm text-gray-400">{notification.message}</p>
//                       <p className="mt-1 text-xs text-gray-500">
//                         {new Date(notification.createdAt).toLocaleDateString()}
//                       </p>
//                     </div>
//                   )}
//                 </Menu.Item>
//               ))
//             )}
//           </div>
//         </Menu.Items>
//       </Transition>
//     </Menu>
//   );
// }
