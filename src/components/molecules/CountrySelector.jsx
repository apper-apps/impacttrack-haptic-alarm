import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedCountry } from "@/store/melSlice";
import Select from "@/components/atoms/Select";
import ApperIcon from "@/components/ApperIcon";

const CountrySelector = () => {
  const dispatch = useDispatch();
  const { selectedCountry } = useSelector((state) => state.mel);

  const countries = [
    { value: "", label: "All Countries" },
    { value: "cambodia", label: "Cambodia" },
    { value: "philippines", label: "Philippines" },
    { value: "solomon-islands", label: "Solomon Islands" },
    { value: "samoa", label: "Samoa" },
    { value: "tonga", label: "Tonga" },
    { value: "fiji", label: "Fiji" },
    { value: "timor-leste", label: "Timor-Leste" },
    { value: "indonesia", label: "Indonesia" },
    { value: "png", label: "Papua New Guinea" },
    { value: "myanmar", label: "Myanmar" }
  ];

  return (
    <div className="flex items-center space-x-2">
      <ApperIcon name="Globe" size={16} className="text-gray-600" />
      <Select
options={countries}
        value={selectedCountry || ""}
        onChange={(e) => dispatch(setSelectedCountry(e.target.value || null))}
        placeholder="Select country..."
        className="min-w-48"
      />
    </div>
  );
};

export default CountrySelector;