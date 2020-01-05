import React from 'react';
import styled, {keyframes} from "styled-components";
import config from "../../config"
import Button from "../button";

const {palette} = config;

const getWidthString = (span) => {
    if (!span) return;
    let width = span / 12 * 100;
    return `width: ${width}%;`
};

const Row = styled.div`
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    @media only screen and (min-width: 768px) {
        flex-flow: row nowrap;
    }
`;

const Column = styled.div`
    outline: 1px dashed ${palette.blue4};
    min-height: 2vh;
    ${({ xs }) => (xs ? getWidthString(xs) : "width: 100%")}
    @media only screen and (min-width: 768px) {
        ${({ sm }) => sm && getWidthString(sm)};
    }
    @media only screen and (min-width: 992px) {
        ${({ md }) => md && getWidthString(md)};
    }
    @media only screen and (min-width: 1200px) {
        ${({ lg }) => lg && getWidthString(lg)};
    }
`;

const Header = styled(Row)`
    background: ${palette.color12}; 
    font-size: calc(16px + 2vmin);
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

const Logo = styled.img`
    animation: ${spin} infinite 20s linear;
    max-width: 100%;
    max-height: 100%;
`;

const Link = styled.a`
  color: #61dafb;
  font-size: calc(4px + 2vmin);
`;

const Grid = () => {
    console.log("re-rendering");
    return (
        <div>
            <Header>
                <Column xs={12} sm={2}>
                    <Logo src={`./logo192.png`} alt={`comatch logo`}/>
                </Column>
                <Column xs={12} sm={9}>
                    Welcome to Express and React
                </Column>
                <Column xs={12} sm={1}>
                    <Link href={`/api-explorer`}>API Doc</Link>
                </Column>
            </Header>
            <Row>
                <Column xs={12} sm={1}>
                </Column>
                <Column xs={12} sm={10}>
                    <Button/>
                </Column>
                <Column xs={12} sm={1}>
                </Column>
            </Row>
        </div>
    );
};

export default Grid;
