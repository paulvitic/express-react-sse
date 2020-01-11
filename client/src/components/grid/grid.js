import React from 'react';
import styled, {keyframes} from "styled-components";
import config from "../../config"

const {palette} = config;

const getWidthString = (span) => {
    if (!span) return;
    let width = span / 12 * 100;
    return `width: ${width}%;`
};

export const Row = styled.div`
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    @media only screen and (min-width: 768px) {
        flex-flow: row nowrap;
    }
`;

export const Column = styled.div`
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
