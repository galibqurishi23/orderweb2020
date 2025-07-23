/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.2-MariaDB, for osx10.20 (arm64)
--
-- Host: localhost    Database: dinedesk_db
-- ------------------------------------------------------
-- Server version	11.8.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `addon_groups`
--

DROP TABLE IF EXISTS `addon_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `addon_groups` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('radio','checkbox') DEFAULT 'radio',
  `required` tinyint(1) DEFAULT 0,
  `multiple` tinyint(1) DEFAULT 0,
  `max_selections` int(11) DEFAULT 1,
  `active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addon_groups`
--

LOCK TABLES `addon_groups` WRITE;
/*!40000 ALTER TABLE `addon_groups` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `addon_groups` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `addon_options`
--

DROP TABLE IF EXISTS `addon_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `addon_options` (
  `id` varchar(255) NOT NULL,
  `addon_group_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `available` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_addon_group_id` (`addon_group_id`),
  KEY `idx_display_order` (`display_order`),
  CONSTRAINT `addon_options_ibfk_1` FOREIGN KEY (`addon_group_id`) REFERENCES `addon_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addon_options`
--

LOCK TABLES `addon_options` WRITE;
/*!40000 ALTER TABLE `addon_options` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `addon_options` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `postcode` varchar(20) NOT NULL,
  `isDefault` tinyint(1) DEFAULT 0,
  `customerId` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addresses_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `billing`
--

DROP TABLE IF EXISTS `billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `subscription_plan` enum('starter','professional','enterprise') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'GBP',
  `billing_period_start` datetime NOT NULL,
  `billing_period_end` datetime NOT NULL,
  `status` enum('pending','paid','failed','refunded') NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing`
--

LOCK TABLES `billing` WRITE;
/*!40000 ALTER TABLE `billing` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `billing` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `parent_id` varchar(255) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `categories` VALUES
('02133bef-729a-424c-bc06-afa21dc2d643','825d2c87-4a50-46f6-af5a-1cfc9537803c','Drink',NULL,1,0,NULL,NULL,NULL,NULL,'2025-07-16 14:05:37','2025-07-16 14:05:37'),
('12dcc3dd-5ab8-4783-aa48-f9798c123652','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','burger',NULL,1,3,NULL,NULL,NULL,NULL,'2025-07-16 10:25:24','2025-07-16 10:25:24'),
('24cc407e-67ca-4add-bd05-bb24db2f2407','825d2c87-4a50-46f6-af5a-1cfc9537803c','Burgar',NULL,1,1,NULL,NULL,NULL,NULL,'2025-07-16 14:05:45','2025-07-16 14:05:45'),
('3450c5a4-2d43-4f5b-96a4-b9fa1f1a8bea','2687d5dd-00b9-4357-bbeb-71c0e2dac205','Drink',NULL,1,3,NULL,NULL,NULL,NULL,'2025-07-17 12:57:01','2025-07-17 12:57:01'),
('3ea3ec7d-7d70-49a1-a874-e99812947159','2687d5dd-00b9-4357-bbeb-71c0e2dac205','Burger',NULL,1,1,NULL,NULL,NULL,NULL,'2025-07-17 12:56:47','2025-07-17 12:56:47'),
('5b6d5734-1efb-4750-b550-444dff1e923d','825d2c87-4a50-46f6-af5a-1cfc9537803c','Tikka',NULL,1,2,NULL,NULL,NULL,NULL,'2025-07-16 14:05:53','2025-07-16 14:05:53'),
('6306b69a-2e95-4bc4-b4c4-1d86db158796','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','drink',NULL,1,2,NULL,NULL,NULL,NULL,'2025-07-16 10:23:42','2025-07-16 10:23:42'),
('6705296b-c786-4fea-b6e5-c86dd6ebb87e','79dd71ad-3563-47d9-b623-a59629d91975','rice',NULL,1,0,NULL,NULL,NULL,NULL,'2025-07-16 07:53:16','2025-07-16 07:53:16'),
('6fb18e8b-7b69-4a73-bdc2-9bbff8a729ee','2687d5dd-00b9-4357-bbeb-71c0e2dac205','Set Menu',NULL,1,4,NULL,NULL,NULL,NULL,'2025-07-17 13:03:09','2025-07-17 13:03:09'),
('9b42d8a1-7a32-4fdc-af09-8d3f7ce20cf6','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','Test Category','A test category',1,0,NULL,NULL,NULL,NULL,'2025-07-16 08:15:10','2025-07-16 08:15:10'),
('c0529542-7e26-41c0-b145-7a86b32fd96c','2687d5dd-00b9-4357-bbeb-71c0e2dac205','Tikka',NULL,1,2,NULL,NULL,NULL,NULL,'2025-07-17 12:56:56','2025-07-17 12:56:56'),
('ce7e9bb1-16f8-4a12-b414-2262fe370953','2687d5dd-00b9-4357-bbeb-71c0e2dac205','rice',NULL,1,0,NULL,NULL,NULL,NULL,'2025-07-16 14:24:44','2025-07-16 14:24:44'),
('e3f49a91-e503-4f49-ae55-ef868b692e98','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','rice',NULL,1,1,NULL,NULL,NULL,NULL,'2025-07-16 10:23:33','2025-07-16 10:23:33');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email_per_tenant` (`tenant_id`,`email`),
  KEY `idx_customers_tenant_id` (`tenant_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `delivery_zones`
--

DROP TABLE IF EXISTS `delivery_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_zones` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('postcode') NOT NULL DEFAULT 'postcode',
  `postcodes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`postcodes`)),
  `deliveryFee` decimal(10,2) NOT NULL,
  `minOrder` decimal(10,2) NOT NULL,
  `deliveryTime` int(11) NOT NULL,
  `collectionTime` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `idx_delivery_zones_type` (`type`),
  CONSTRAINT `delivery_zones_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_zones`
--

LOCK TABLES `delivery_zones` WRITE;
/*!40000 ALTER TABLE `delivery_zones` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `delivery_zones` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `menu_item_addon_groups`
--

DROP TABLE IF EXISTS `menu_item_addon_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_addon_groups` (
  `id` varchar(255) NOT NULL,
  `menu_item_id` varchar(255) NOT NULL,
  `addon_group_id` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_menu_addon` (`menu_item_id`,`addon_group_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_addon_group` (`addon_group_id`),
  CONSTRAINT `menu_item_addon_groups_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_item_addon_groups_ibfk_2` FOREIGN KEY (`addon_group_id`) REFERENCES `addon_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_addon_groups`
--

LOCK TABLES `menu_item_addon_groups` WRITE;
/*!40000 ALTER TABLE `menu_item_addon_groups` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `menu_item_addon_groups` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `category_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` text DEFAULT NULL,
  `image_hint` varchar(255) DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_set_menu` tinyint(1) DEFAULT 0,
  `preparation_time` int(11) DEFAULT 15,
  `addons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`addons`)),
  `characteristics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`characteristics`)),
  `nutrition` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nutrition`)),
  `set_menu_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`set_menu_items`)),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_available` (`available`),
  KEY `idx_featured` (`is_featured`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `menu_items` VALUES
('01551869-7844-4242-a479-21bc768a9948','0a37cd0a-f6cb-4b97-b509-3660a76f25e3',NULL,'vat',NULL,10.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 07:54:32','2025-07-16 07:54:32'),
('0919fe1d-0ef7-4882-9e92-5c790c51823c','2687d5dd-00b9-4357-bbeb-71c0e2dac205','c0529542-7e26-41c0-b145-7a86b32fd96c','Chicken',NULL,10.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-17 12:57:47','2025-07-17 12:57:47'),
('0a05006b-3f5e-412c-a98b-82e55433b697','825d2c87-4a50-46f6-af5a-1cfc9537803c','02133bef-729a-424c-bc06-afa21dc2d643','7up',NULL,4.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752674882305_6is8fnqpw\",\"tenantId\":\"\",\"name\":\"Size\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752674886003_igvtzot1l\",\"addonGroupId\":\"addon_1752674882305_6is8fnqpw\",\"name\":\"Learg\",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752674891938_cchfwtjre\",\"addonGroupId\":\"addon_1752674882305_6is8fnqpw\",\"name\":\"Mid\",\"price\":1,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-16 14:08:17','2025-07-16 14:08:17'),
('10dcd573-32bd-4f0c-ab86-10b071310e88','2687d5dd-00b9-4357-bbeb-71c0e2dac205','3ea3ec7d-7d70-49a1-a874-e99812947159','Beef Burger',NULL,5.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752757032114_yobx2xmdk\",\"tenantId\":\"\",\"name\":\"Extra \",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752757038165_9gtr1w5s7\",\"addonGroupId\":\"addon_1752757032114_yobx2xmdk\",\"name\":\"Cheee\",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752757045730_d1yeq9vj6\",\"addonGroupId\":\"addon_1752757032114_yobx2xmdk\",\"name\":\"Big size\",\"price\":4,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-17 12:57:37','2025-07-17 12:57:56'),
('15207c7c-6fc7-4bf1-9e79-b41958e84aa9','2687d5dd-00b9-4357-bbeb-71c0e2dac205','3450c5a4-2d43-4f5b-96a4-b9fa1f1a8bea','7up',NULL,2.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752757098112_uw3jjen79\",\"tenantId\":\"\",\"name\":\"Size\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752757106763_c9icxht89\",\"addonGroupId\":\"addon_1752757098112_uw3jjen79\",\"name\":\"Learge\",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752757113114_q3yjt2d8y\",\"addonGroupId\":\"addon_1752757098112_uw3jjen79\",\"name\":\"Mid\",\"price\":1,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-17 12:58:37','2025-07-17 12:58:37'),
('3978dc1b-6cf3-4a74-b4a2-436861b0f5aa','0a37cd0a-f6cb-4b97-b509-3660a76f25e3',NULL,'burger',NULL,10.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 10:24:42','2025-07-16 10:24:42'),
('3e9c0bb4-979c-45ea-a4be-0aaeba4987a3','825d2c87-4a50-46f6-af5a-1cfc9537803c','24cc407e-67ca-4add-bd05-bb24db2f2407','Beef Burger',NULL,10.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752674844605_bfpv7cclg\",\"tenantId\":\"\",\"name\":\"Extra\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752674849956_7i9q49ypb\",\"addonGroupId\":\"addon_1752674844605_bfpv7cclg\",\"name\":\"Chees\",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752674858838_4zl8yucn7\",\"addonGroupId\":\"addon_1752674844605_bfpv7cclg\",\"name\":\"mix\",\"price\":3,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-16 14:07:44','2025-07-16 14:07:44'),
('4696ff03-93da-4e58-bd72-1122af18d6c4','2687d5dd-00b9-4357-bbeb-71c0e2dac205',NULL,'Set 1',NULL,15.00,NULL,NULL,1,0,1,15,'[{\"id\":\"addon_1752757425981_3binxjv9p\",\"tenantId\":\"\",\"name\":\"tikka\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752757553046_d4e61zgyh\",\"addonGroupId\":\"addon_1752757425981_3binxjv9p\",\"name\":\"tikka\",\"price\":4,\"available\":true,\"displayOrder\":0}]}]','[]','null','[{\"id\":\"set_1752757404713_lv2dgetlz\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"Chicken \",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757412696_r6gj3v4zc\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"burger \",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757420264_y4o1wsdya\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"drink\",\"replaceable\":false,\"replaceableWith\":[]}]','[]','2025-07-17 13:05:58','2025-07-17 13:05:58'),
('489a7095-5eae-4b2b-a88a-ea5a32ddd7c0','2687d5dd-00b9-4357-bbeb-71c0e2dac205','ce7e9bb1-16f8-4a12-b414-2262fe370953','peow',NULL,10.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 14:24:56','2025-07-16 14:24:56'),
('505b5383-5b96-4a36-a4e8-0092fc62ff7c','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','e3f49a91-e503-4f49-ae55-ef868b692e98','vat',NULL,5.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 11:29:55','2025-07-16 11:29:55'),
('668cd3e2-8a17-4302-9ef0-f09340ee9358','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','9b42d8a1-7a32-4fdc-af09-8d3f7ce20cf6','Test Pizza','A delicious test pizza',12.99,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 08:15:17','2025-07-16 08:15:17'),
('776e1dde-add1-47d0-a236-32a0a79788a9','825d2c87-4a50-46f6-af5a-1cfc9537803c',NULL,'Rice',NULL,5.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 14:06:05','2025-07-16 14:06:05'),
('8674cc40-7cee-4910-ac4d-2f4b5e06ceae','2687d5dd-00b9-4357-bbeb-71c0e2dac205',NULL,'Set 1',NULL,20.00,NULL,NULL,1,0,1,15,'[]','[]','null','[{\"id\":\"set_1752757129082_dwqpgi04i\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"tikka\",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757138347_fr3vhoiol\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"Burger\",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757144331_1z5g0y6im\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"drink\",\"replaceable\":false,\"replaceableWith\":[]}]','[]','2025-07-17 12:59:23','2025-07-17 12:59:23'),
('922a6d1c-2010-48fd-bb7b-57ecf25e8afc','2687d5dd-00b9-4357-bbeb-71c0e2dac205','6fb18e8b-7b69-4a73-bdc2-9bbff8a729ee','set 1',NULL,10.00,NULL,NULL,1,0,1,15,'[{\"id\":\"addon_1752757602831_xc7sd09xa\",\"tenantId\":\"\",\"name\":\"extra\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752757608346_3xm38scte\",\"addonGroupId\":\"addon_1752757602831_xc7sd09xa\",\"name\":\"tikka\",\"price\":5,\"available\":true,\"displayOrder\":0}]}]','[]','null','[{\"id\":\"set_1752757585811_oxvffy61i\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"chicken \",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757593715_yoymgoydd\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"busrger \",\"replaceable\":false,\"replaceableWith\":[]},{\"id\":\"set_1752757597814_r6kmb9dlf\",\"menuItemId\":\"\",\"quantity\":1,\"name\":\"drink\",\"replaceable\":false,\"replaceableWith\":[]}]','[]','2025-07-17 13:06:54','2025-07-17 13:06:54'),
('92bb4933-93a0-4ff5-998c-0a8b43b2afaa','2687d5dd-00b9-4357-bbeb-71c0e2dac205','c0529542-7e26-41c0-b145-7a86b32fd96c','lamb',NULL,14.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-17 12:58:05','2025-07-17 12:58:05'),
('9bf65bd5-e7b7-401a-a52c-84774a74378b','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','6306b69a-2e95-4bc4-b4c4-1d86db158796','Cococola',NULL,40.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752661436822_ohqagx7q5\",\"name\":\"L\",\"price\":0,\"type\":\"extra\",\"required\":false,\"multiple\":false,\"options\":[]}]','[]','null','[]','[]','2025-07-16 10:24:09','2025-07-16 10:24:09'),
('a64a9463-f467-434c-bef5-0ab22ade843a','0a37cd0a-f6cb-4b97-b509-3660a76f25e3','12dcc3dd-5ab8-4783-aa48-f9798c123652','burger',NULL,10.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752663881445_4yzfdt7bp\",\"tenantId\":\"\",\"name\":\"Extra \",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752663891011_9cfjtk9bo\",\"addonGroupId\":\"addon_1752663881445_4yzfdt7bp\",\"name\":\"Cheeh \",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752663920261_8qjv9hraj\",\"addonGroupId\":\"addon_1752663881445_4yzfdt7bp\",\"name\":\"meet\",\"price\":5,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752663927744_atg2aw9il\",\"addonGroupId\":\"addon_1752663881445_4yzfdt7bp\",\"name\":\"chicken \",\"price\":4,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-16 10:25:48','2025-07-16 11:27:51'),
('ba14b46a-d24e-4f45-8a70-b7f9429743c7','825d2c87-4a50-46f6-af5a-1cfc9537803c','5b6d5734-1efb-4750-b550-444dff1e923d','Pelow Rice',NULL,5.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 14:06:25','2025-07-16 14:06:25'),
('c9f81b81-8222-4634-a8da-2f6a2c7120de','825d2c87-4a50-46f6-af5a-1cfc9537803c',NULL,'Beef Burger',NULL,10.00,NULL,NULL,1,0,0,15,'[{\"id\":\"addon_1752674799489_ee2ef6cei\",\"tenantId\":\"\",\"name\":\"Extra\",\"description\":\"\",\"type\":\"radio\",\"required\":false,\"multiple\":false,\"maxSelections\":1,\"active\":true,\"displayOrder\":0,\"options\":[{\"id\":\"option_1752674806736_l5wqhrjef\",\"addonGroupId\":\"addon_1752674799489_ee2ef6cei\",\"name\":\"Chees\",\"price\":2,\"available\":true,\"displayOrder\":0},{\"id\":\"option_1752674812088_6e4wrpzig\",\"addonGroupId\":\"addon_1752674799489_ee2ef6cei\",\"name\":\"Mix\",\"price\":5,\"available\":true,\"displayOrder\":0}]}]','[]','null','[]','[]','2025-07-16 14:07:00','2025-07-16 14:07:00'),
('fd58220f-6246-4119-a644-328eda22b021','0a37cd0a-f6cb-4b97-b509-3660a76f25e3',NULL,'burger',NULL,10.00,NULL,NULL,1,0,0,15,'[]','[]','null','[]','[]','2025-07-16 10:25:17','2025-07-16 10:25:17');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(255) NOT NULL,
  `orderId` varchar(255) NOT NULL,
  `menuItemId` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `selectedAddons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`selectedAddons`)),
  `specialInstructions` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `orderId` (`orderId`),
  KEY `menuItemId` (`menuItemId`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `customerName` varchar(255) DEFAULT NULL,
  `customerPhone` varchar(50) DEFAULT NULL,
  `customerEmail` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('confirmed','cancelled') NOT NULL,
  `orderType` enum('delivery','pickup','advance','collection') NOT NULL,
  `isAdvanceOrder` tinyint(1) DEFAULT 0,
  `scheduledTime` datetime DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `deliveryFee` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `tax` decimal(10,2) NOT NULL,
  `voucherCode` varchar(255) DEFAULT NULL,
  `printed` tinyint(1) DEFAULT 0,
  `customerId` varchar(255) DEFAULT NULL,
  `paymentMethod` enum('cash','card','voucher') DEFAULT 'cash',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `orderNumber` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderNumber` (`orderNumber`),
  UNIQUE KEY `unique_order_number` (`orderNumber`),
  KEY `customerId` (`customerId`),
  KEY `idx_orders_tenant_id` (`tenant_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`createdAt`),
  KEY `idx_orders_order_number` (`orderNumber`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `platform_settings`
--

DROP TABLE IF EXISTS `platform_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`settings_json`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_settings`
--

LOCK TABLES `platform_settings` WRITE;
/*!40000 ALTER TABLE `platform_settings` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `platform_settings` VALUES
(1,'{\n    \"platformName\": \"DineDesk SaaS\",\n    \"defaultCurrency\": \"GBP\",\n    \"allowedCurrencies\": [\"GBP\", \"USD\", \"EUR\"],\n    \"subscriptionPlans\": {\n        \"starter\": {\n            \"name\": \"Starter\",\n            \"monthlyPrice\": 29,\n            \"features\": [\"Up to 100 orders/month\", \"Basic support\", \"Standard themes\"]\n        },\n        \"professional\": {\n            \"name\": \"Professional\", \n            \"monthlyPrice\": 79,\n            \"features\": [\"Up to 1000 orders/month\", \"Priority support\", \"Custom themes\", \"Advanced analytics\"]\n        },\n        \"enterprise\": {\n            \"name\": \"Enterprise\",\n            \"monthlyPrice\": 199,\n            \"features\": [\"Unlimited orders\", \"24/7 support\", \"White label\", \"API access\", \"Custom integrations\"]\n        }\n    },\n    \"trialPeriodDays\": 14,\n    \"defaultTheme\": {\n        \"primary\": \"224 82% 57%\",\n        \"primaryForeground\": \"210 40% 98%\",\n        \"background\": \"210 40% 98%\",\n        \"accent\": \"210 40% 94%\"\n    }\n}','2025-07-06 22:39:21','2025-07-06 22:39:21');
/*!40000 ALTER TABLE `platform_settings` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `print_jobs`
--

DROP TABLE IF EXISTS `print_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `print_jobs` (
  `id` varchar(36) NOT NULL,
  `printer_id` varchar(36) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `order_id` varchar(36) DEFAULT NULL,
  `content` text NOT NULL,
  `type` enum('order','receipt','kitchen','bar','label') NOT NULL,
  `status` enum('pending','printing','completed','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_print_jobs_printer_id` (`printer_id`),
  KEY `idx_print_jobs_tenant_id` (`tenant_id`),
  KEY `idx_print_jobs_order_id` (`order_id`),
  KEY `idx_print_jobs_status` (`status`),
  KEY `idx_print_jobs_created_at` (`created_at`),
  CONSTRAINT `print_jobs_ibfk_1` FOREIGN KEY (`printer_id`) REFERENCES `printers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `print_jobs`
--

LOCK TABLES `print_jobs` WRITE;
/*!40000 ALTER TABLE `print_jobs` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `print_jobs` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `printer_test_results`
--

DROP TABLE IF EXISTS `printer_test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `printer_test_results` (
  `id` varchar(36) NOT NULL,
  `printer_id` varchar(36) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `message` text NOT NULL,
  `response_time_ms` int(11) DEFAULT NULL,
  `tested_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_printer_test_results_printer_id` (`printer_id`),
  KEY `idx_printer_test_results_tenant_id` (`tenant_id`),
  KEY `idx_printer_test_results_tested_at` (`tested_at`),
  CONSTRAINT `printer_test_results_ibfk_1` FOREIGN KEY (`printer_id`) REFERENCES `printers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printer_test_results`
--

LOCK TABLES `printer_test_results` WRITE;
/*!40000 ALTER TABLE `printer_test_results` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `printer_test_results` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `printers`
--

DROP TABLE IF EXISTS `printers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `printers` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `ipAddress` varchar(45) NOT NULL,
  `port` int(11) NOT NULL,
  `type` enum('kitchen','receipt','bar','dot-matrix','label') NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_printers_tenant_id` (`tenant_id`),
  KEY `idx_printers_active` (`active`),
  KEY `idx_printers_type` (`type`),
  CONSTRAINT `printers_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printers`
--

LOCK TABLES `printers` WRITE;
/*!40000 ALTER TABLE `printers` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `printers` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `restaurant_settings`
--

DROP TABLE IF EXISTS `restaurant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_settings` (
  `id` int(11) NOT NULL,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings_json`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_settings`
--

LOCK TABLES `restaurant_settings` WRITE;
/*!40000 ALTER TABLE `restaurant_settings` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `restaurant_settings` VALUES
(1,'{\"name\":\"Bistro\",\"description\":\"A cozy spot serving modern European cuisine with a twist.\",\"logo\":\"https://placehold.co/200x200.png\",\"logoHint\":\"restaurant logo\",\"coverImage\":\"https://placehold.co/1600x400.png\",\"coverImageHint\":\"restaurant interior\",\"currency\":\"GBP\",\"taxRate\":0.2,\"website\":\"https://www.dinedesk.com\",\"phone\":\"0123 456 7890\",\"email\":\"contact@dinedesk.com\",\"address\":\"123 Culinary Lane, London, W1A 1AA, United Kingdom\",\"orderPrefix\":\"OOD\",\"advanceOrderPrefix\":\"ADV\",\"openingHours\":{\"monday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:54\"},\"tuesday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:54\"},\"wednesday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:54\"},\"thursday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:55\"},\"friday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"22:00\"},\"saturday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:00\"},\"sunday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"10:00\",\"closeTime\":\"23:00\"}},\"orderThrottling\":{\"monday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"tuesday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"wednesday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"thursday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"friday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"saturday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"sunday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false}},\"paymentSettings\":{\"cash\":{\"enabled\":true},\"stripe\":{\"enabled\":true,\"apiKey\":\"\",\"apiSecret\":\"\"},\"globalPayments\":{\"enabled\":false,\"merchantId\":\"\",\"apiSecret\":\"\"},\"worldpay\":{\"enabled\":false,\"apiKey\":\"\",\"merchantId\":\"\"}},\"orderTypeSettings\":{\"deliveryEnabled\":false,\"advanceOrderEnabled\":true,\"collectionEnabled\":true},\"theme\":{\"primary\":\"224 82% 57%\",\"primaryForeground\":\"210 40% 98%\",\"background\":\"210 40% 98%\",\"accent\":\"210 40% 94%\"}}');
/*!40000 ALTER TABLE `restaurant_settings` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `set_menu_templates`
--

DROP TABLE IF EXISTS `set_menu_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `set_menu_templates` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `total_price` decimal(10,2) NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tenant_set_menus` (`tenant_id`),
  CONSTRAINT `set_menu_templates_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `set_menu_templates`
--

LOCK TABLES `set_menu_templates` WRITE;
/*!40000 ALTER TABLE `set_menu_templates` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `set_menu_templates` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `super_admin_users`
--

DROP TABLE IF EXISTS `super_admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `super_admin_users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('super_admin','support') DEFAULT 'super_admin',
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admin_users`
--

LOCK TABLES `super_admin_users` WRITE;
/*!40000 ALTER TABLE `super_admin_users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `super_admin_users` VALUES
('super-admin-1','admin@dinedesk.com','$2b$10$mI5P7dpnc5hl/KlIpoCgz.XuZieLFt8x4WzkVXuHnZsBfeSvmfSl.','Super Admin','super_admin',1,'2025-07-06 22:39:21','2025-07-07 21:08:47'),
('super-admin-1752666079109','admin@restaurant.com','$2b$12$tqmvlJKZO5LGANaBWOutLOEfFlQ3dddBMOhxZwmWNm1SXahfjYHTi','Super Admin','super_admin',1,'2025-07-16 11:41:19','2025-07-16 11:41:19');
/*!40000 ALTER TABLE `super_admin_users` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenant_settings`
--

DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(255) NOT NULL,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`settings_json`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `tenant_settings_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_settings`
--

LOCK TABLES `tenant_settings` WRITE;
/*!40000 ALTER TABLE `tenant_settings` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tenant_settings` VALUES
(92,'12215b12-08b7-48c8-8496-be0444c0a5f1','{\"name\":\"babur\",\"description\":\"\",\"address\":\"443A Brockley Road\",\"phone\":\"+447306506797\",\"email\":\"gqurishi@yeahoo.com\",\"currency\":\"GBP\",\"taxRate\":0.1,\"website\":\"\",\"logoHint\":\"\",\"coverImage\":\"\",\"coverImageHint\":\"\",\"favicon\":\"\",\"openingHours\":{\"monday\":{\"closed\":false,\"timeMode\":\"split\",\"openTime\":\"09:00\",\"closeTime\":\"22:00\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"tuesday\":{\"closed\":false,\"timeMode\":\"split\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"wednesday\":{\"closed\":false,\"timeMode\":\"split\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"thursday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"09:00\",\"closeTime\":\"17:00\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"friday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"09:00\",\"closeTime\":\"17:00\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"saturday\":{\"closed\":false,\"timeMode\":\"single\",\"openTime\":\"09:00\",\"closeTime\":\"17:00\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"},\"sunday\":{\"closed\":true,\"timeMode\":\"single\",\"openTime\":\"09:00\",\"closeTime\":\"17:00\",\"morningOpen\":\"09:00\",\"morningClose\":\"14:00\",\"eveningOpen\":\"17:00\",\"eveningClose\":\"22:00\"}},\"orderThrottling\":{\"monday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"tuesday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"wednesday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"thursday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"friday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"saturday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false},\"sunday\":{\"interval\":15,\"ordersPerInterval\":10,\"enabled\":false}},\"paymentSettings\":{\"cash\":{\"enabled\":true},\"stripe\":{\"enabled\":false,\"apiKey\":\"\",\"apiSecret\":\"\",\"merchantId\":\"\"},\"globalPayments\":{\"enabled\":false,\"apiKey\":\"\",\"apiSecret\":\"\",\"merchantId\":\"\"},\"worldpay\":{\"enabled\":false,\"apiKey\":\"\",\"apiSecret\":\"\",\"merchantId\":\"\"}},\"orderTypeSettings\":{\"deliveryEnabled\":true,\"advanceOrderEnabled\":true,\"collectionEnabled\":true},\"collectionTimeSettings\":{\"collectionTimeMinutes\":30,\"enabled\":true,\"displayMessage\":\"Your order will be ready for collection in {time} minutes\"},\"deliveryTimeSettings\":{\"deliveryTimeMinutes\":45,\"enabled\":true,\"displayMessage\":\"Your order will be delivered in {time} minutes\"},\"theme\":{\"primary\":\"224 82% 57%\",\"primaryForeground\":\"0 0% 100%\",\"background\":\"0 0% 100%\",\"accent\":\"210 40% 96%\"}}','2025-07-21 21:17:41','2025-07-21 22:18:18');
/*!40000 ALTER TABLE `tenant_settings` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenant_users`
--

DROP TABLE IF EXISTS `tenant_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_users` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('owner','manager','staff') DEFAULT 'staff',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email_per_tenant` (`tenant_id`,`email`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_tenant_users_tenant_id` (`tenant_id`),
  CONSTRAINT `tenant_users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_users`
--

LOCK TABLES `tenant_users` WRITE;
/*!40000 ALTER TABLE `tenant_users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tenant_users` VALUES
('bc0d997a-c64a-4b6c-a904-810272f24c0b','12215b12-08b7-48c8-8496-be0444c0a5f1','admin@gmail.com',NULL,'$2b$10$2np9e0SKfy5T465b23UDU.2VpFPNPTYcXK0pvSXXhJLP43V9.IhGS','Admin','owner',NULL,1,'2025-07-21 21:17:41','2025-07-21 21:17:41');
/*!40000 ALTER TABLE `tenant_users` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','suspended','trial','cancelled') DEFAULT 'trial',
  `subscription_plan` enum('starter','professional','enterprise') DEFAULT 'starter',
  `subscription_status` enum('active','past_due','cancelled','trialing') DEFAULT 'trialing',
  `trial_ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_tenants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tenants` VALUES
('12215b12-08b7-48c8-8496-be0444c0a5f1','babur','babur','gqurishi@yeahoo.com','+447306506797','443A Brockley Road','active','starter','trialing','2025-08-04 22:17:41','2025-07-21 21:17:41','2025-07-21 22:17:44');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('percentage','amount') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `minOrder` decimal(10,2) DEFAULT 0.00,
  `maxDiscount` decimal(10,2) DEFAULT NULL,
  `expiryDate` date NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `usageLimit` int(11) DEFAULT NULL,
  `usedCount` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code_per_tenant` (`tenant_id`,`code`),
  CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-07-22 10:46:50
