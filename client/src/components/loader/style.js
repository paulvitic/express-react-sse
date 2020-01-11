import styled, { keyframes } from 'styled-components';

export const Dimmer = styled.div`
  display: flex;
  background-color: rgba(255,255,255,.85);
  opacity: 1;
  visibility: ${props => props.isLoading ? 'visible' : 'hidden'}; 
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  vertical-align: middle;
  padding: 1em;
  line-height: 1;
  animation-duration: .5s;
  transition: background-color .5s linear;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  flex-direction: column;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  user-select: none;
  will-change: opacity;
  z-index: 10;
  :after, :before {
    -webkit-box-sizing: inherit;
    box-sizing: inherit;
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const Spinner = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  & div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 32px;
    height: 32px;
    margin: 8px;
    border: 2px solid #ff695e;
    border-radius: 50%;
    animation: ${spin} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #ff695e transparent transparent transparent;
  }
  & div:nth-child(1) {
    animation-delay: -0.45s;
  }
  & div:nth-child(2) {
    animation-delay: -0.3s;
  }
  & div:nth-child(3) {
    animation-delay: -0.15s;
  }
`;
