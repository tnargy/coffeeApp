import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { History } from './pages/History.tsx'
import { LogRoast } from './pages/LogRoast.tsx'
import { PackBags } from './pages/PackBags.tsx'
import { Profiles } from './pages/Profiles.tsx'
import { ReceiveLot } from './pages/ReceiveLot.tsx'
import { RecordSale } from './pages/RecordSale.tsx'
import { Records } from './pages/Records.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/receive" element={<ReceiveLot />} />
        <Route path="/roast" element={<LogRoast />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/pack" element={<PackBags />} />
        <Route path="/sale" element={<RecordSale />} />
        <Route path="/history" element={<History />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
