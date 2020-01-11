import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { createGlobalStyle } from "styled-components";
import {StateProvider} from "./context";
import Header from "./components/header/header";
import {Home, Login, PrivateRoute} from "./pages";

const GlobalStyle = createGlobalStyle`
  body {
    display: block;
    margin: 0;
  }
  
  * {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

const App = () => {
    return(
        <StateProvider initialState={{}}>
            <GlobalStyle />
            <Router>
                <div>
                    <Header />
                    <Switch>
                        <Route path="/login">
                            <Login />
                        </Route>
                        <PrivateRoute path="/">
                            <Home />
                        </PrivateRoute>
                    </Switch>
                </div>
            </Router>
        </StateProvider>
    )
};

export default App;
