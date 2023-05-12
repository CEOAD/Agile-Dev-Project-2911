
export let favs = document.getElementById("chosen");

export let cityArray = [
    {city: "Vancouver, BC, Canada", coord: {lat: 49.246292, lng: -123.116226}},
        {city: "London, UK", coord: {lat: 51.509865, lng: -0.118092}},
        {city: "Singapore", coord: {lat: 1.290270, lng: 103.851959}}
];

export function createLi (placeName){
    const newLi = document.createElement("li");
    const newSpan = document.createElement("span");
    const newDel = document.createElement("button");

    newSpan.textContent = placeName;
    newDel.textContent = "Del";
    newDel.classList.add("del");
    newLi.appendChild(newSpan);
    newLi.appendChild(newDel);
    return newLi
}