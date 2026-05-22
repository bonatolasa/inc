import { Navigate } from "react-router-dom";

const Unauthorized = () => {
  return <Navigate to="/dashboard" replace />;
};

export default Unauthorized;