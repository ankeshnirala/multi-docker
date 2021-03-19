import { Link } from "react-router-dom";

const otherPage = () => {
  return (
    <div>
      I am some other page!
      <Link to="/">Go Back Home</Link>
    </div>
  );
};

export default otherPage;
