import React from 'react'
import PropTypes from 'prop-types';
import { Dimmer, Spinner } from "./style";

const Loader = (props) => {
  return (
    <Dimmer {...props}>
      <Spinner>
        <div/><div/><div/><div/>
      </Spinner>
    </Dimmer>
  );
};

Loader.propTypes = {
  isLoading:PropTypes.bool.isRequired,
};


Loader.defaultProps = {
  isLoading:false,
};

export default Loader;
