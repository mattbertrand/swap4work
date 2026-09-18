import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Package, MessageSquare, Hammer, ArrowLeftRight, ArrowDown, ArrowRight } from "lucide-react";

const chainNodes = [
  { icon: Package, label: "Item", sub: "Something you no longer need", color: "bg-orange-100 text-orange-600" },
  { icon: MessageSquare, label: "Negotiation", sub: "Agree on the work", color: "bg-blue-100 text-blue-600" },
  { icon: Hammer, label: "Service", sub: "The work gets done", color: "bg-amber-100 text-amber-600" },
  { icon: ArrowLeftRight, label: "Exchange", sub: "The item changes hands", color: "bg-green-100 text-green-600" },
];

export default function HowItWorksHero() {
  return (
    <div className="bg-white py-16 px-4 md:py-24">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6"
        >
          How Swap4Work <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Works</span>
        </motion.h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          Exchange things you no longer need for services from people nearby.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0 mb-12"
        >
          {chainNodes.map((node, i) => (
            <React.Fragment key={node.label}>
              <div className="w-full md:w-48 bg-gradient-to-br from-gray-50 to-orange-50 border-2 border-orange-100 rounded-2xl p-5 flex md:flex-col items-center gap-3 md:gap-2 md:text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${node.color}`}>
                  <node.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">{node.label}</p>
                  <p className="text-xs text-gray-500">{node.sub}</p>
                </div>
              </div>
              {i < chainNodes.length - 1 && (
                <div className="flex items-center justify-center px-2 py-1 md:py-0 text-orange-400">
                  <ArrowDown className="w-6 h-6 md:hidden" />
                  <ArrowRight className="w-6 h-6 hidden md:block" />
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Browse")}>
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-lg px-8 py-6 h-auto w-full sm:w-auto">
              Browse Items
            </Button>
          </Link>
          <Link to={createPageUrl("CreateItem")}>
            <Button size="lg" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
              Post an Item
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}