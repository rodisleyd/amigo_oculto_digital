/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Share from "./components/Share";
import Reveal from "./components/Reveal";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen max-w-lg mx-auto px-6 py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draw/:id" element={<Share />} />
          <Route path="/reveal/:drawId/:participantId" element={<Reveal />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
