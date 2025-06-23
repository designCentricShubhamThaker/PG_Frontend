import axios from "axios";

export const handleSubmitOrder = async ({
  e,
  orderNumber,
  dispatcherName,
  customerName,
  orderItems,
  setIsSubmitting,
  setError,
  addOrderToLocalStorage,
  isConnected,
  notifyTeam,
  onCreateOrder,
  resetForm,
  onClose
}) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError("");

  try {
    if (!orderNumber || !dispatcherName || !customerName) {
      setError("Please fill in all required fields: order number, dispatcher name, and customer name");
      setIsSubmitting(false);
      return;
    }

    let hasValidItems = false;
    const formattedItems = [];

    for (const item of orderItems) {
      const validGlassItems = item.teamAssignments.glass.filter(
        (glass) => glass.glass_name !== "N/A" && glass.glass_name !== "" && glass.quantity
      );
      const validCapItems = item.teamAssignments.caps.filter(
        (cap) => cap.cap_name !== "N/A" && cap.cap_name !== "" && cap.quantity
      );
      const validBoxItems = item.teamAssignments.boxes.filter(
        (box) => box.box_name !== "N/A" && box.box_name !== "" && box.quantity
      );
      const validPumpItems = item.teamAssignments.pumps.filter(
        (pump) => pump.pump_name !== "N/A" && pump.pump_name !== "" && pump.quantity
      );

      if (
        validGlassItems.length > 0 ||
        validCapItems.length > 0 ||
        validBoxItems.length > 0 ||
        validPumpItems.length > 0
      ) {
        hasValidItems = true;

        formattedItems.push({
          name: item.name,
          glass: validGlassItems.map((glass) => ({
            glass_name: glass.glass_name,
            quantity: parseInt(glass.quantity, 10) || 0,
            weight: glass.weight || "",
            neck_size: glass.neck_size || "",
            decoration: glass.decoration || "",
            decoration_no: glass.decoration_no || "",
            decoration_details: {
              type: glass.decoration || "",
              decoration_number: glass.decoration_no || ""
            },
            team: glass.team || "Glass Manufacturing - Mumbai",
            status: "Pending",
            team_tracking: {
              total_completed_qty: 0,
              completed_entries: [],
              status: "Pending"
            }
          })),
          caps: validCapItems.map((cap) => ({
            cap_name: cap.cap_name,
            neck_size: cap.neck_size || "",
            quantity: parseInt(cap.quantity, 10) || 0,
            process: cap.process || "",
            material: cap.material || "",
            team: cap.team || "Cap Manufacturing - Delhi",
            status: "Pending",
            team_tracking: {
              total_completed_qty: 0,
              completed_entries: [],
              status: "Pending"
            }
          })),
          boxes: validBoxItems.map((box) => ({
            box_name: box.box_name,
            quantity: parseInt(box.quantity, 10) || 0,
            approval_code: box.approval_code || "",
            team: box.team || "Box Manufacturing - Pune",
            status: "Pending",
            team_tracking: {
              total_completed_qty: 0,
              completed_entries: [],
              status: "Pending"
            }
          })),
          pumps: validPumpItems.map((pump) => ({
            pump_name: pump.pump_name,
            neck_type: pump.neck_type || "",
            quantity: parseInt(pump.quantity, 10) || 0,
            team: pump.team || "Pump Manufacturing - Chennai",
            status: "Pending",
            team_tracking: {
              total_completed_qty: 0,
              completed_entries: [],
              status: "Pending"
            }
          }))
        });
      }
    }

    if (!hasValidItems) {
      setError("Please add at least one valid item with name and quantity in any team");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      order_number: orderNumber.trim(),
      dispatcher_name: dispatcherName.trim(),
      customer_name: customerName.trim(),
      order_status: "Pending",
      items: formattedItems
    };

    // const response = await axios.post("http://localhost:5000/api/orders", orderData);
    const response = await axios.post("https://pg-backend-o05l.onrender.com/api/orders", orderData);

    if (response.data.success) {
      const newOrder = response.data.data;
      console.log(newOrder);
      addOrderToLocalStorage(newOrder);

      if (isConnected && notifyTeam) {
        const notificationSent = notifyTeam(newOrder);
        if (notificationSent) {
          console.log("✅ Teams notified successfully about new order");
        } else {
          console.warn("⚠️ Order created but team notification failed");
        }
      }

      if (onCreateOrder) onCreateOrder();

      resetForm();
      onClose();
    } else {
      setError("Error creating order: " + (response.data.message || "Unknown error"));
      setIsSubmitting(false);
    }
  } catch (error) {
    console.error("Order creation error:", error);
    setError("Error creating order: " + (error.response?.data?.message || error.message));
    setIsSubmitting(false);
  }
};
