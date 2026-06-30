/**
 * Not Found Page
 */

import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import "./NotFound.scss";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={"notFound"}>
      <Result
        status="404"
        title="Page Not Found"
        subTitle="The page you are looking for does not exist or has been moved."
        extra={
          <Button type="primary" size="large" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
