// resetForm.jsx
export const resetForm = ({
  setOrderNumber,
  setDispatcherName,
  setCustomerName,
  setOrderItems
}) => {
  setOrderNumber('');
  setDispatcherName('');
  setCustomerName('');
  setOrderItems([
    {
      name: "Item 1",
      teamAssignments: {
        glass: [
          {
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
          }
        ],
        caps: [
          {
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
          }
        ],
        boxes: [
          {
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
          }
        ],
        pumps: [
          {
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
          }
        ]
      }
    }
  ]);
};
