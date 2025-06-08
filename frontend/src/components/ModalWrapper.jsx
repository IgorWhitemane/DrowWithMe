export default function ModalWrapper({ children, onClose }) {
  return (
    <>
      {/* Полупрозрачный размытный фон */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 1000,
        }}
      />

      {/* Сама модальная панель */}
      <div
        className="modal-panel"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1100,
        }}
        onClick={(e) => e.stopPropagation()} // Чтобы клик внутри окна не закрывал
      >
        {children}
      </div>
    </>
  );
}
