// src/routes/ProtectedRoute.jsx
import { Route, Redirect } from 'react-router-dom'

// Reemplazar por tu lógica real (context/auth/firebase)
const isAuthenticated = () => false

export default function ProtectedRoute({  ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated()
          ? <Component {...props} />
          : <Redirect to="/" />
      }
    />
  )
}
