// src/App.jsx
import { Switch, Route } from 'react-router-dom'
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/home/Home'
import CatalogPage from "./pages/catalog/CatalogPage";
import QuieroSerClienteForm from "./pages/nuevocliente/QuieroSerClienteForm";
import OrderStatusPage from "./pages/orderstatus/OrderStatusPage";
import MisPedidosPage from "./pages/mispedidos/MisPedidosPage";
import MiStockPage from "./pages/mistock/MiStockPage";
import MiCuentaPage from "./pages/micuenta/MiCuentaPage";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";

// ADMIN pages
import AdminDashboard from './pages/admin/AdminDashboard'
import Users from './pages/admin/Users'
import StockConsignado from './pages/admin/StockConsignado'
import Products from './pages/admin/Products'
import Orders from './pages/admin/Orders'
import CustomerTypes from "./pages/admin/CustomerTypes";
import ProductTypes from "./pages/admin/ProductTypes";
import Settings from "./pages/admin/Settings";
import AdminNotFound from './pages/admin/AdminNotFound'


export default function App() {
  return (
    <Switch>
      {/* Bloque ADMIN con su layout */}
      <ProtectedRoute
        path="/admin"
        allowedRoles={["admin"]}
        render={() => (
          <AdminLayout>
            <Switch>
              <Route exact path="/admin" component={AdminDashboard} />
              <Route path="/admin/users" component={Users} />
              <Route path="/admin/stock-consignado" component={StockConsignado} />
              <Route path="/admin/products" component={Products} />
              <Route path="/admin/orders" component={Orders} />
              <Route path="/admin/product-types" component={ProductTypes} />
              <Route path="/admin/customer-types" component={CustomerTypes} />
              <Route path="/admin/settings" component={Settings} />
              <Route component={AdminNotFound} />
            </Switch>
          </AdminLayout>
        )}
      />

      {/* Público con layout general */}
      <Route
        render={() => (
          <Layout>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/catalogo" component={CatalogPage} />
              <Route path="/quiero-ser-cliente" component={QuieroSerClienteForm} />
              <Route path="/estado-de-pedido" component={OrderStatusPage} />
              <Route path="/mis-pedidos" component={MisPedidosPage} />
              <Route path="/mi-stock" component={MiStockPage} />
              <Route path="/mi-cuenta" component={MiCuentaPage} />
              <Route path="/login" component={Login} />
              <Route path="/reset-password" component={ResetPassword} />
            </Switch>
          </Layout>
        )}
      />
    </Switch>
  )
}
