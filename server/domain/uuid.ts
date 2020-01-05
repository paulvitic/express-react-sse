const uuid = (): string => {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    return ("000" + firstPart.toString(36)).slice(-3) +
        ("000" + secondPart.toString(36)).slice(-3);
};

export default uuid;
