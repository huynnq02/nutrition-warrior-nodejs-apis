export const HandleRequestData = {
  change: (object) => {
    let newData = {};
    for (const property in object) {
      let _value = object[property];
      if (_value == "") _value = null;
      newData[property] = _value;
    }
    return newData;
  },
};
