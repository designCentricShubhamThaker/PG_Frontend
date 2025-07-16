// import { useEffect } from 'react';
// import { useSocket } from '../context/SocketContext.jsx';
// import { useLocation } from 'react-router-dom';

// import {
//   TEAMS,
//   addOrderToLocalStorage,

// } from '../utils/localStorageUtils.jsx';

// const teamPaths = {
//   [TEAMS.GLASS]: '/dashboard/glass',
//   [TEAMS.CAPS]: '/dashboard/caps',
//   [TEAMS.PUMPS]: '/dashboard/pumps',
//   [TEAMS.BOXES]: '/dashboard/boxes',
//   [TEAMS.ACCESSORIES]: '/dashboard/accessories',
//   [TEAMS.PRINTING]: '/dashboard/printing',
//   [TEAMS.FOILING]: '/dashboard/foiling',
//   [TEAMS.COATING]: '/dashboard/coating',
//   [TEAMS.FROSTING]: '/dashboard/frosting'
// };

// const GlobalTeamSocketListener = () => {
//   const { socket } = useSocket();
//   const location = useLocation();

//   useEffect(() => {
//     if (!socket) return;

//     const handleNewOrder = (orderData) => {
//       const newOrder = orderData?.orderData;
//       if (!newOrder || !newOrder.item_ids) return;

//       Object.entries(teamPaths).forEach(([team, path]) => {
//         // Skip if current path is already rendering that team (avoid double write)
//         if (location.pathname.includes(path)) return;

//         // Check if order has relevant assignments
//         const hasTeamAssignments = newOrder.item_ids.some(item =>
//           item.team_assignments?.[team]?.length > 0
//         );

//         if (!hasTeamAssignments) return;

//         // Use `addOrderToLocalStorage` to determine order type and store accordingly
//         addOrderToLocalStorage(newOrder, team);
//       });
//     };

//     socket.on('new-order', handleNewOrder);
//     return () => socket.off('new-order', handleNewOrder);
//   }, [socket, location]);

//   return null; // Invisible background listener
// };

// export default GlobalTeamSocketListener;
