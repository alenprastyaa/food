"use client";
import dynamic from "next/dynamic";

const OutletMap = dynamic(() => import("./OutletMap"), { ssr: false });

export default OutletMap;
