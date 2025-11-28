type CreateModalProp = {
  showcreatemodal: boolean;
  onRequestClose: () => void;
  createroom: () => void;
  roomid?: number
};

import Modal from "react-modal";
Modal.setAppElement("#root")
export const CreateModal = ({
  showcreatemodal,
  onRequestClose,
  createroom,
  roomid
}: CreateModalProp) => {
  return (
    <Modal
      isOpen={showcreatemodal}
      onRequestClose={onRequestClose}
      contentLabel="Create Room"
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        },
        content: {
          position: "static",
          background: "white",
          color: "black",
          padding: "24px",
          borderRadius: "12px",
          width: "350px",
          maxWidth: "90%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          border: "none",
        },
      }}
    >
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>
        {roomid?"Take your room id buddy":"Create Room"}
      </h2>

      <p style={{ marginBottom: "20px", opacity: 0.8 }}>
        {roomid?"This is your new room id take it "+ roomid : "Welcome! Click below to create a new room."}
      </p>

      <button
        onClick={createroom}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "black",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "15px",
        }}
      >
        Create Room
      </button>

      <button
        onClick={onRequestClose}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "10px 14px",
          background: "#e5e5e5",
          color: "black",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "15px",
        }}
      >
        Cancel
      </button>
    </Modal>
  );
};
