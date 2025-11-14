import { useContext } from "react";
import AuthContext from "./Context";

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
}



export default useAuth;
export { useCurrentUser };