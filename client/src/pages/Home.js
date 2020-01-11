import React from "react";
import Button from "../components/button";
import {Column, Row} from "../components/grid";

export function Home() {
    return (
        <Row>
            <Column xs={12} sm={1}/>
            <Column xs={12} sm={10}>
                <Button/>
            </Column>
            <Column xs={12} sm={1}/>
        </Row>
    );
}
