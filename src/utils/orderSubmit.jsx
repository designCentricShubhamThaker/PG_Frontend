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
          glass: validGlassItems.map((glass) => {
            // Parse decoration processes from the decoration key
            const decorationKey = glass.decoration || "";

            return {
              glass_name: glass.glass_name,
              quantity: parseInt(glass.quantity, 10) || 0,
              weight: glass.weight || "",
              neck_size: glass.neck_size || "",
              decoration: decorationKey, // This is the key like "coating_printing_frosting"
              decoration_no: glass.decoration_no || "",
              decoration_details: {
                type: decorationKey,
                decoration_number: glass.decoration_no || "",
                coating: decorationKey.includes('coating'),
                printing: decorationKey.includes('printing'),
                foiling: decorationKey.includes('foiling'),
                frosting: decorationKey.includes('frosting')

              },
              team: glass.team || "Glass Manufacturing - Mumbai",
              status: "Pending",
              team_tracking: {
                total_completed_qty: 0,
                completed_entries: [],
                status: "Pending"
              }
            };
          }),

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
            team: box.team || "Box Manufacturing - Bangalore",
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
      setError("Please add at least one valid item (glass, cap, box, or pump) with quantity");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      order_number: orderNumber,
      dispatcher_name: dispatcherName,
      customer_name: customerName,
      order_status: "Pending",
      items: formattedItems
    };
    if (isConnected) {
      try {
        const response = await axios.post("http://localhost:5000/api/orders", orderData, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.data.success) {
          console.log("Order created successfully:", response.data);
          addOrderToLocalStorage(response.data.data);
          if (notifyTeam) {
            notifyTeam(response.data.data);
          }
          if (onCreateOrder) {
            onCreateOrder(response.data.data);
          }
          resetForm();
          if (onClose) {
            onClose();
          }

          setError("");
        } else {
          setError(response.data.message || "Failed to create order");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        if (apiError.response?.data?.message) {
          setError(apiError.response.data.message);
        } else {
          setError("Failed to create order. Please try again.");
        }
      }
    } else {
      if (onClose) {
        onClose();
      }
      setError("");
    }

  } catch (error) {
    console.error("Error submitting order:", error);
    setError("An unexpected error occurred. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
