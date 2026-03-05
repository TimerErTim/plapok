import { Route, Routes } from "react-router";

import { GlobalProviders } from "./providers";
import { GlobalLayout } from "./layouts/global";
import { GlobalRoutes } from "./routes";

function App() {
  return (
    <GlobalProviders>
      <GlobalLayout>
        <GlobalRoutes />
      </GlobalLayout>
    </GlobalProviders>
  );
}

export default App;
