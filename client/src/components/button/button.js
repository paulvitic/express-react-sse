import React from 'react';
import styled from "styled-components";
import { useStateValue } from '../../context';
import { DO_NOTHING, CHANGE_THEME } from '../../reducers/actionTypes';

const StyledButton = styled.button`
    background-color: ${props => props.color};
`;

const Button = () => {
    const [{ theme }, dispatch] = useStateValue();

    return (
        <StyledButton
            color={theme.primary}
            onMouseOut={() => dispatch(theme.primary==='blue'? {type:DO_NOTHING, payload:'button is blue'} : {type:CHANGE_THEME, payload:'blue'})}
            onClick={() => dispatch({type:CHANGE_THEME, payload:'red'})}
        >
            Make me blue!
        </StyledButton>
    );
};

export default Button;
