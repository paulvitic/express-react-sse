import {Link} from "react-router-dom";
import React from "react";
import styled, {keyframes} from "styled-components";
import {Column, Row} from "../grid";
import config from "../../config";

const {palette} = config;

const HeaderRow = styled(Row)`
    background: ${palette.color12}; 
    font-size: calc(14px + 2vmin);
    color: white; 
    text-align: center;  
    @media only screen and (min-width: 768px) {
        text-align: left;  
    }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(90deg);
  }
`;

export const Logo = styled.img`
    animation: ${spin} infinite 20s linear;
    max-width: 100%;
    max-height: 100%;
`;


export const HyperLink = styled.a`
  color: #61dafb;
  font-size: calc(4px + 2vmin);
`;

const Header = () => {
    return (
            <HeaderRow>
                <Column xs={12} sm={2}>
                    <Logo src={`./logo192.png`} alt={`comatch logo`}/>
                </Column>
                <Column xs={12} sm={9}>
                    COMATCH Product & Engineering Framework
                </Column>
                <Column xs={12} sm={1}>
                    <ul>
                        <li>
                            <HyperLink href={`/api-explorer`}>API Doc</HyperLink>
                        </li>
                        <li>
                            <Link to={"/"}>Home</Link>
                        </li>
                        <li>
                            <Link to={"/login"}>Login</Link>
                        </li>
                    </ul>
                </Column>
            </HeaderRow>
    );
};

export default Header;
