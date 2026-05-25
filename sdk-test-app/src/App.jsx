function App() {

  const triggerError = () => {

    const x = undefined;

    x.map();
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>SDK Test App</h1>

      <button onClick={triggerError}>
        Trigger Error
      </button>
    </div>
  );
}

export default App;