import React from "react";

const ContractNotDeployed = () => {
  return (
    <div className="jumbotron">
      <h3>Onidex Contract Not Deployed To This Network.</h3>
      <hr className="my-4" />
      <p className="lead">
        Connect Metamask to Polygon - Mumbai
        like Ganache.
      </p>
    </div>
  );
};

export default ContractNotDeployed;
