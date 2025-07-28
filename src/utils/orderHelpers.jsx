import axios from "axios";

export const createDefaultItem = (type) => {
  const defaults = {
    glass: {
      glass_name: "N/A",
      quantity: "",
      weight: "",
      neck_size: "",
      decoration: "N/A",
      decoration_no: "",
      team: "Glass Manufacturing - Mumbai",
      status: "Pending",
      team_tracking: {
        total_completed_qty: 0,
        completed_entries: [],
        status: "Pending"
      }
    },
    caps: {
      cap_name: "N/A",
      neck_size: "",
      quantity: "",
      process: "N/A",
      material: "N/A",
      team: "Cap Manufacturing - Delhi",
      status: "Pending",
      team_tracking: {
        total_completed_qty: 0,
        completed_entries: [],
        status: "Pending"
      }
    },
    boxes: {
      box_name: "N/A",
      quantity: "",
      approval_code: "",
      team: "Box Manufacturing - Pune",
      status: "Pending",
      team_tracking: {
        total_completed_qty: 0,
        completed_entries: [],
        status: "Pending"
      }
    },
    pumps: {
      pump_name: "N/A",
      neck_type: "N/A",
      quantity: "",
      team: "Pump Manufacturing - Chennai",
      status: "Pending",
      team_tracking: {
        total_completed_qty: 0,
        completed_entries: [],
        status: "Pending"
      }
    },
    accessories: {
      accessories_name: "N/A",
      quantity: "",
      rate: "",
      team: "Accessories Team - Default",
      status: "Pending",
      team_tracking: {
        total_completed_qty: 0,
        completed_entries: [],
        status: "Pending"
      }
    }
  };
  return defaults[type];
};

export const handleDuplicateOrder = async ({
  duplicateOrderNumber,
  setDuplicateError,
  setIsSearching,
  setDispatcherName,
  setCustomerName,
  setOrderItems,
  setGlassSearches,
  setCapSearches,
  setBoxSearches,
  setPumpSearches,
  setAccessorySearches,
  setShowDuplicateSection,
  setDuplicateOrderNumberValue
}) => {
  if (!duplicateOrderNumber.trim()) {
    setDuplicateError("Please enter an order number");
    return;
  }

  setIsSearching(true);
  setDuplicateError("");

  try {
    // const response = await axios.get(`http://localhost:5000/api/orders/number/${duplicateOrderNumber.trim()}`);
    const response = await axios.get(`https://pg-backend-o05l.onrender.com/api/orders/number/${duplicateOrderNumber.trim()}`);

    if (response.data.success && response.data.data) {
      const orderData = response.data.data;

      setDispatcherName(orderData.dispatcher_name || "");
      setCustomerName(orderData.customer_name || "");

      const transformedItems = orderData.items.map((item, index) => {
        const glassItems = item.glass?.length
          ? item.glass.map(glass => ({
              ...createDefaultItem("glass"),
              ...glass,
              quantity: glass.quantity?.toString() || ""
            }))
          : [createDefaultItem("glass")];

        const capItems = item.caps?.length
          ? item.caps.map(cap => ({
              ...createDefaultItem("caps"),
              ...cap,
              quantity: cap.quantity?.toString() || ""
            }))
          : [createDefaultItem("caps")];

        const boxItems = item.boxes?.length
          ? item.boxes.map(box => ({
              ...createDefaultItem("boxes"),
              ...box,
              quantity: box.quantity?.toString() || ""
            }))
          : [createDefaultItem("boxes")];

        const pumpItems = item.pumps?.length
          ? item.pumps.map(pump => ({
              ...createDefaultItem("pumps"),
              ...pump,
              quantity: pump.quantity?.toString() || ""
            }))
          : [createDefaultItem("pumps")];

        const accessoryItems = item.accessories?.length
          ? item.accessories.map(acc => ({
              ...createDefaultItem("accessories"),
              ...acc,
              quantity: acc.quantity?.toString() || ""
            }))
          : [createDefaultItem("accessories")];

        return {
          name: item.name || `Item ${index + 1}`,
          teamAssignments: {
            glass: glassItems,
            caps: capItems,
            boxes: boxItems,
            pumps: pumpItems,
            accessories: accessoryItems
          }
        };
      });

      setOrderItems(transformedItems);

      const newGlassSearches = {};
      const newCapSearches = {};
      const newBoxSearches = {};
      const newPumpSearches = {};
      const newAccessorySearches = {};

      transformedItems.forEach((item, itemIndex) => {
        item.teamAssignments.glass.forEach((glass, glassIndex) => {
          if (glass.glass_name !== "N/A") newGlassSearches[`${itemIndex}-${glassIndex}`] = glass.glass_name;
        });
        item.teamAssignments.caps.forEach((cap, capIndex) => {
          if (cap.cap_name !== "N/A") newCapSearches[`${itemIndex}-${capIndex}`] = cap.cap_name;
        });
        item.teamAssignments.boxes.forEach((box, boxIndex) => {
          if (box.box_name !== "N/A") newBoxSearches[`${itemIndex}-${boxIndex}`] = box.box_name;
        });
        item.teamAssignments.pumps.forEach((pump, pumpIndex) => {
          if (pump.pump_name !== "N/A") newPumpSearches[`${itemIndex}-${pumpIndex}`] = pump.pump_name;
        });
        item.teamAssignments.accessories.forEach((acc, accIndex) => {
          if (acc.accessories_name !== "N/A") newAccessorySearches[`${itemIndex}-${accIndex}`] = acc.accessories_name;
        });
      });

      setGlassSearches(newGlassSearches);
      setCapSearches(newCapSearches);
      setBoxSearches(newBoxSearches);
      setPumpSearches(newPumpSearches);
      setAccessorySearches(newAccessorySearches);
      setShowDuplicateSection(false);
      setDuplicateOrderNumberValue("");
    } else {
      setDuplicateError("Order not found with this number");
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    setDuplicateError(error.response?.data?.message || "Error fetching order data");
  } finally {
    setIsSearching(false);
  }
};
