import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

export default function FinalCta() {
  return (
    <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="text-3xl md:text-5xl font-bold mb-4"
        >
          Ready to make your first Swap?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-lg text-orange-50 mb-8"
        >
          Find something useful. Offer something you're good at. Make an exchange.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to={createPageUrl("Browse")}>
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
              <Package className="w-5 h-5 mr-2" />
              Browse Items
            </Button>
          </Link>
          <Link to={createPageUrl("CreateItem")}>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-6 h-auto w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post an Item
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}